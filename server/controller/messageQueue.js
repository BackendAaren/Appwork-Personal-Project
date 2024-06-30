import { v4 as uuidv4 } from "uuid";
import os from "os";
import { WebSocket } from "ws";
import { MongoDB } from "../model/mongodb.js";
import { channel } from "diagnostics_channel";
export class MessageType {
  constructor(
    channel,
    messageType,
    payload,
    messageID,
    enqueueTime,
    status,
    requeueCount = 0,
    node
  ) {
    this.channel = channel;
    this.messageType = messageType;
    this.payload = payload;
    this.messageID = messageID;
    this.enqueueTime = enqueueTime;
    this.status = "unprocessed";
    this.requeueCount = requeueCount;
    this.node = node;
  }
}

export class MessageQueue {
  constructor() {
    this.channels = {};
    this.waiting = {};
    this.monitorClients = new Set();
    this.dbUrl = "mongodb://localhost:27017";
    this.dbName = "RabbitMQ_storage";
    this.maxRequeueAttempt = 5;

    this.stats = {
      length: {},
      throughput: {},
      delay: {},
      blocked: {},
      messageTotalComplete: {},
      now_executing: {},
      inboundRate: {},
      outboundRate: {},
    };
    // 定義計算進入和出站速率的計時器
    setInterval(() => {
      // this.calculateInboundRates();
      // this.calculateOutboundRates();
      this.broadcastMonitorStatus();
    }, 1000); // 每秒執行一次計算
    this.mongoDB = new MongoDB(this.dbUrl, this.dbName);
    this.recoverMessagesFromMongoDB();
    // this.mongoDB.connect();
    process.on("SIGINT", async () => {
      await this.mongoDB.close();
      process.exit();
    });
  }

  async recoverMessagesFromMongoDB() {
    try {
      await this.mongoDB.connect();
      const index_collection = this.mongoDB.getCollection("message_index");
      let message_index = await index_collection.find().toArray();
      const channelNames = message_index.map((item) => item.channel);
      // console.log(message_index);
      // console.log(channelNames);
      for (const channel of channelNames) {
        console.log(channel);
        const collection = this.mongoDB.getCollection("messages");
        const messages = await collection
          .find({ status: "unprocessed", channel: `${channel}` })
          .toArray();
        if (messages.length > 0) {
          // console.log("message recovering....");
          // console.log(messages);
          const now = Date.now();
          this.channels[channel] = messages.map(
            (msg) =>
              new MessageType(
                msg.channel,
                msg.messageType,
                msg.payload,
                msg.messageID,
                now,
                msg.status,
                msg.requeueCount,
                msg.node
              )
          );

          this.stats.length[channel] = this.channels[channel].length;
          console.log(this.stats.length[channel]);
        }
      }
      console.log("Recover messages from mongodb successfully");
    } catch (error) {
      console.error("Failed to recover message from MongoDB");
    }
  }

  calculateInboundRates() {
    const now = Date.now();
    Object.keys(this.stats.inboundRate).forEach((channel) => {
      const { count, timestamp } = this.stats.inboundRate[channel];
      const elapsedTime = (now - timestamp) / 1000;
      const inboundRate = elapsedTime > 0 ? count / elapsedTime : 0;
      console.log(
        `Channel ${channel} inbound rate: ${inboundRate.toFixed(2)} MPS`
      );
      this.stats.inboundRate[channel] = {
        count: 0,
        timestamp: now,
        inboundRate: `${inboundRate.toFixed(2)}MPS`,
      };
    });
  }

  calculateOutboundRates() {
    const now = Date.now();
    Object.keys(this.stats.outboundRate).forEach((channel) => {
      const { count, timestamp } = this.stats.outboundRate[channel];
      const elapsedTime = (now - timestamp) / 1000;
      const outboundRate = elapsedTime > 0 ? count / elapsedTime : 0;
      console.log(
        `Channel ${channel} outbound rate: ${outboundRate.toFixed(2)} MPS`
      );
      this.stats.outboundRate[channel] = {
        count: 0,
        timestamp: now,
        outboundRate: `${outboundRate.toFixed(2)}MPS`,
      };
    });
  }

  updateMonitorStatus(statusUpdates) {
    Object.assign(this.stats, statusUpdates);
    this.broadcastMonitorStatus();
  }
  //傳監控資訊給所有連線監控端
  broadcastMonitorStatus() {
    const statusMessage = JSON.stringify(this.stats);
    this.monitorClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(statusMessage);
      }
    });
  }
  //處理websocket連線
  handleMonitorClient(client) {
    this.monitorClients.add(client);

    client.send(JSON.stringify(this.stats));

    client.on("close", () => {
      this.monitorClients.delete(client);
    });
  }

  async enqueue(channel, message, isSync = false) {
    const enqueueTime = Date.now();
    message.messageID = uuidv4().slice(0, 7);
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }
    message.enqueueTime = enqueueTime;
    console.log(message);
    this.channels[channel].push(message);

    // console.log(message);
    //Persistent system
    if (isSync) {
      await this.mongoDB
        .getCollection(`messages`)
        .insertOne({ ...message, channel });
      await this.mongoDB
        .getCollection(`message_index`)
        .updateOne({ channel }, { $set: { channel } }, { upsert: true });
    } else {
      this.mongoDB
        .getCollection(`messages`)
        .insertOne({ ...message, channel })
        .catch((err) =>
          console.error("Failed to save message to MongoDB", err)
        );
      this.mongoDB
        .getCollection(`message_index`)
        .updateOne({ channel }, { $set: { channel } }, { upsert: true });
    }

    //監控佇列長度
    this.stats.length[channel] = this.channels[channel].length;
    //計算吞吐量
    if (!this.stats.throughput[channel]) {
      this.stats.throughput[channel] = { in: 0, out: 0 };
    }
    this.stats.throughput[channel].in += 1;
    // 計算進入消息數量
    if (!this.stats.inboundRate[channel]) {
      this.stats.inboundRate[channel] = {
        count: 0,
        timestamp: Date.now(),
        inboundRate: 0,
      };
    }
    this.stats.inboundRate[channel].count += 1;

    //若dequeue進入等待狀態，enqueue將information推入channel將resolve取出告知dequeue繼續運作
    if (this.waiting[channel] && this.waiting[channel].length > 0) {
      const resolveNext = this.waiting[channel].shift();
      resolveNext();
    }
  }

  async dequeue(channel, autoAck = true) {
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }

    while (this.channels[channel].length === 0) {
      if (!this.waiting[channel]) {
        this.waiting[channel] = [];
      }
      //當channel裡面沒有information時將resolve推入waiting進入等待狀態
      await new Promise((resolve) => this.waiting[channel].push(resolve));
    }
    const message = this.channels[channel][0];
    console.log(message);

    //計算目前陣列長度
    this.stats.length[channel] = this.channels[channel].length;

    //計算throughput
    if (!this.stats.throughput[channel]) {
      this.stats.throughput[channel] = { in: 0, out: 0 };
    }
    this.stats.throughput[channel].out += 1;
    //正在處理的message
    this.stats.now_executing[channel] = message.messageID;
    if (this.channels[channel].length === 0) {
      this.stats.now_executing[channel] = "Message execute complete";
    }
    //計算處理完畢數量
    if (!this.stats.messageTotalComplete[channel]) {
      this.stats.messageTotalComplete[channel] = { totalComplete: 0 };
    }
    this.stats.messageTotalComplete[channel].totalComplete += 1;

    //計算延遲
    const dequeueTime = Date.now();
    this.stats.delay[channel] = (dequeueTime - message.enqueueTime) / 1000;
    //計算outboundRate
    if (!this.stats.outboundRate[channel]) {
      this.stats.outboundRate[channel] = {
        count: 0,
        timesStamp: Date.now(),
        outboundRate: 0,
      };
    }
    this.stats.outboundRate[channel].count += 1;
    console.log(`This is ACK message ${autoAck}`);
    if (autoAck) {
      const ackSuccess = await this.ack(channel, message.messageID);
      console.log(`This is ackmessage ${ackSuccess}`);
      if (ackSuccess) {
        this.channels[channel].shift(); //確認成功才將message移除
      } else {
        this.requeue(channel, message.messageID); //否則就requeue並重新排隊
      }
    }
    return message;
  }

  async ack(channel, messageID) {
    try {
      await this.mongoDB
        .getCollection("messages")
        .updateOne({ messageID, channel }, { $set: { status: "processed" } });
      console.log(`Message${messageID} acknowledged`);
      return true;
    } catch (error) {
      console.error(`Failed to acknowledge message ${messageID}`, error);
      return false;
    }
  }

  async requeue(channel, messageID) {
    try {
      const messageIndex = this.channels[channel].findIndex(
        (msg) => msg.messageID === messageID
      );
      if (messageIndex === -1) {
        console.error(`Message ${messageID} not found in channel${channel}`);
        return false;
      }
      const message = this.channels[channel][messageIndex];
      message.requeueCount += 1;
      if (message.requeueCount > this.maxRequeueAttempt) {
        console.log(
          `Message ${messageID} discard after exceeding max requeue attempt`
        );
        await this.mongoDB
          .getCollection("messages")
          .updateOne({ messageID, channel }, { $set: { status: "discard" } });
        this.channels[channel].splice(messageIndex, 1);
      } else {
        await this.mongoDB.getCollection("messages").updateOne(
          { messageID, channel },
          {
            $set: {
              status: "unprocessed",
              requeueCount: message.requeueCount,
            },
          }
        );
        this.channels[channel].splice(messageIndex, 1); // 移除原本位置的訊息
        this.channels[channel].push(message);
      }

      //更新message queue長度統計
      this.stats.length[channel] = this.channels[channel].length;

      //若有等待的consumer立即解鎖他
      if (this.waiting[channel] && this.waiting[channel].length > 0) {
        const resolveNext = this.waiting[channel].shift();
        resolveNext();
      }
      console.log(`Message ${messageID} requeue successfully `);
      return true;
    } catch (error) {
      console.error(`Failed to requeue message ${messageID} :`, error);
      return false;
    }
  }

  getStats() {
    return this.stats;
  }
}
