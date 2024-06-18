import { v4 as uuidv4 } from "uuid";
export class MessageType {
  constructor(channel, messageType, payload) {
    this.channel = channel;
    this.messageType = messageType;
    this.payload = payload;
    this.messageID = null;
  }
}

export class MessageQueue {
  constructor() {
    this.channels = {};
    this.waiting = {};
    this.monitorClients = new Set();
    this.monitorStatus = {
      consumedCount: 0,
      completedMessage: null,
      processingMessage: null,
      processingPercentage: 0,
    };
    this.stats = {
      length: {},
      throughput: {},
      delay: {},
      blocked: {},
      messageTotalComplete: {},
      now_executing: {},
    };
  }

  updateMonitorStatus(statusUpdates) {
    Object.assign(this.monitorStatus, statusUpdates);
    this.broadcastMonitorStatus();
  }
  //傳監控資訊給所有連線監控端
  broadcastMonitorStatus() {
    const statusMessage = JSON.stringify(this.monitorStatus);
    this.monitorClients.forEach((client) => {
      client.send(statusMessage);
    });
  }
  //處理websocket連線
  handleMonitorClient(client) {
    this.monitorClients.add(client);

    client.send(JSON.stringify(this.monitorStatus));

    client.on("close", () => {
      this.monitorClients.delete(client);
    });
  }

  async enqueue(channel, message) {
    const enqueueTime = Date.now();
    message.messageID = uuidv4().slice(0, 7);
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }
    this.channels[channel].push(message);
    message.enqueueTime = enqueueTime;
    //監控佇列長度
    this.stats.length[channel] = this.channels[channel].length;
    //計算吞吐量
    if (!this.stats.throughput[channel]) {
      this.stats.throughput[channel] = { in: 0, out: 0 };
    }
    this.stats.throughput[channel].in += 1;

    //若dequeue進入等待狀態，enqueue將information推入channel將resolve取出告知dequeue繼續運作
    if (this.waiting[channel] && this.waiting[channel].length > 0) {
      const resolveNext = this.waiting[channel].shift();
      resolveNext();
    }
  }

  async dequeue(channel) {
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
    const message = this.channels[channel].shift();

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
    this.stats.delay[channel] = dequeueTime - message.enqueueTime;

    return message;
  }

  getStats() {
    return this.stats;
  }
}
