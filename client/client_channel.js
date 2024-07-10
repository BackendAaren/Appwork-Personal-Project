import {
  MessageQueue,
  MessageType,
} from "../server/controller/messageQueue.js";
import { EventEmitter } from "events";

const messageProcessor = new EventEmitter();
//定義事件綁定on與觸發emit
messageProcessor.on("process", async (message) => {
  console.log(`Processing message: ${JSON.stringify(message)}`);
  await new Promise((resolve) => setTimeout(resolve, 100));
});

function producer(messageQueue, channel, messageType, payload) {
  const message = new MessageType(channel, messageType, payload);
  messageQueue.enqueue(channel, message);
}

async function consumer(messageQueue, channel) {
  while (true) {
    const message = await messageQueue.dequeue(channel);

    console.log(
      `Consume message from channel${channel}: ${JSON.stringify(message)}`
    );
    messageProcessor.emit("process", message);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// Example usage:
const messageQueue = new MessageQueue();

// Create producers for different channels
producer(messageQueue, "channel1", 1, "Payload for channel 1");
producer(messageQueue, "channel2", 2, "Payload for channel 2");

// Create consumers for different channels
consumer(messageQueue, "channel1");
consumer(messageQueue, "channel2");
