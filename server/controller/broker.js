// Message object
export class MessageType {
  constructor(messageType, payload) {
    this.messageType = messageType;
    this.payload = payload;
    // You can add any other fields here as needed
  }
}

// // Example usage:
// const message1 = new MessageType(1, "Payload 1");
// console.log(message1);

// const message2 = new MessageType(2, "Payload 2");
// console.log(message2);

export class MessageQueue {
  constructor() {
    this.queue = [];
    this.lock = false;
    this.waiting = [];
  }

  async enqueue(message) {
    this.queue.push(message);
    if (this.waiting.length > 0) {
      const resolveNext = this.waiting.shift();
      resolveNext();
    }
  }
  async dequeue() {
    while (this.queue.length === 0) {
      await new Promise((resolve) => this.waiting.push(resolve));
    }
    return this.queue.shift();
  }
}

// Example usage:
// const mq = new MessageQueue();

// // Producer
// setInterval(() => {
//   const message = new MessageType("text", "Hello World");
//   console.log("Enqueuing:", message);
//   mq.enqueue(message);
// }, 1000);

// // Consumer
// (async () => {
//   while (true) {
//     const message = await mq.dequeue();
//     console.log("Dequeued:", message);
//   }
// })();
