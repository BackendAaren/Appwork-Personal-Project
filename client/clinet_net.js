import http from "http";

class MessageQueueClient {
  constructor(hostname, port) {
    this.options = {
      hostname: hostname,
      port: port,
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  // Enqueue a message to a specific channel
  enqueueMessage(channel, message) {
    const options = {
      ...this.options,
      path: `/enqueue/${channel}`,
      method: "POST",
    };

    const req = http.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      res.setEncoding("utf8");
      res.on("data", (data) => {
        console.log(`Response: ${data}`);
      });
    });

    req.on("error", (error) => {
      console.error(`Error: ${error.message}`);
    });

    req.write(JSON.stringify(message));
    req.end();
  }

  // Dequeue a message from a specific channel using async/await
  async dequeueMessage(channel, autoAck = true) {
    const options = {
      ...this.options,
      path: `/dequeue/${channel}?autoAck=${autoAck}`,
      method: "GET",
    };

    try {
      const data = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let rawData = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            rawData += chunk;
          });

          res.on("end", () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(rawData);
            } else {
              reject(
                new Error(`Request failed with status code ${res.statusCode}`)
              );
            }
          });
        });

        req.on("error", (error) => {
          reject(error);
        });

        req.end();
      });

      console.log(`Message consume: ${data}`);
      return data;
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }

  ackMessage(channel, messageID) {
    const options = {
      ...this.options,
      path: `/ack/${channel}/${messageID}`,
      method: "POST",
    };

    const req = http.request(options, (res) => {
      console.log(`Status Code:${res.statusCode}`);
      res.setEncoding("utf-8");
      res.on("data", (data) => {
        console.log(`Response:${data}`);
      });
    });

    req.on("error", (error) => {
      console.error(`Error:${error.message}`);
    });
    req.end();
  }
}

// 使用示例
const client = new MessageQueueClient("localhost", 3002);

// let isProcessing = false;
// setInterval(async () => {
//   if (isProcessing) {
//     return;
//   }
//   isProcessing = true;

//   try {
//     const message = await client.dequeueMessage("channel1", true);
//     console.log(`This is dequeue: ${message}`);

//     const parsedMessage = JSON.parse(message);

//     // 模擬特定訊息處理出錯的情況

//     console.log(`Processing message: ${parsedMessage.messageID}`);
//     await client.ackMessage("channel1", parsedMessage.messageID);
//   } catch (error) {
//     console.error(`Error processing message: ${error.message}`);
//     // 可以進行錯誤處理，例如重新入隊、記錄錯誤等
//   }

//   isProcessing = false;
// }, 100);
// let isProcessing2 = false;
// setInterval(async () => {
//   if (isProcessing2) {
//     return;
//   }
//   isProcessing2 = true;

//   try {
//     const message = await client.dequeueMessage("channel3", true);
//     console.log(`This is dequeue: ${message}`);

//     const parsedMessage = JSON.parse(message);

//     // 模擬特定訊息處理出錯的情況

//     console.log(`Processing message: ${parsedMessage.messageID}`);
//     await client.ackMessage("channel1", parsedMessage.messageID);
//   } catch (error) {
//     console.error(`Error processing message: ${error.message}`);
//     // 可以進行錯誤處理，例如重新入隊、記錄錯誤等
//   }

//   isProcessing2 = false;
// }, 200);
let isProcessing3 = false;
setInterval(async () => {
  if (isProcessing3) {
    return;
  }
  isProcessing3 = true;

  try {
    const message = await client.dequeueMessage("channel1", true);
    console.log(`This is dequeue: ${message}`);

    const parsedMessage = JSON.parse(message);

    // 模擬特定訊息處理出錯的情況

    console.log(`Processing message: ${parsedMessage.messageID}`);
    await client.ackMessage("channel1", parsedMessage.messageID);
  } catch (error) {
    console.error(`Error processing message: ${error.message}`);
    // 可以進行錯誤處理，例如重新入隊、記錄錯誤等
  }

  isProcessing3 = false;
}, 600);

// function enqueueMessages(channel, count) {
//   for (let i = 0; i < count; i++) {
//     client.enqueueMessage(channel, {
//       messageType: "text",
//       payload: `Message${i + 10}`,
//     });
//   }
// }

// 向各個頻道分別發送三條消息
// enqueueMessages("channel1", 1);
// enqueueMessages("channel2", 1);
// enqueueMessages("channel3", 1);
// enqueueMessages("channel4", 1);

setInterval(() => {
  client.enqueueMessage("channel1", {
    messageType: "text",
    payload: `Message:${Math.random() + 10}`,
  });
}, 300);
setInterval(() => {
  client.enqueueMessage("channel2", {
    messageType: "text",
    payload: `Message:${Math.random() + 10}`,
  });
}, 1000);
setInterval(() => {
  client.enqueueMessage("channel3", {
    messageType: "text",
    payload: `Message:${Math.random() + 10}`,
  });
}, 1000);
setInterval(() => {
  client.enqueueMessage("channel4", {
    messageType: "text",
    payload: `Message:${Math.random() + 10}`,
  });
}, 1000);
