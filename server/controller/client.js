import { MessageQueue, MessageType } from "./broker.js";

// Producer function
function producer(messageQueue, messageType, payload) {
  const message = new MessageType(messageType, payload);
  messageQueue.enqueue(message);
}
// Consumer function
async function consumer(messageQueue) {
  while (true) {
    const message = await messageQueue.dequeue();
    // Process the message
    console.log(`Consumed message: ${JSON.stringify(message)}`);
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 100)); // wait for 1 second
  }
}

// Usage example
const messageQueue = new MessageQueue();

// Start the consumer (in parallel)
consumer(messageQueue);

// Produce some messages (simulated)
producer(messageQueue, 1, "Hello");
producer(messageQueue, 2, "World");
producer(messageQueue, 3, "Node.js");

// Produce messages continuously (simulated)
setInterval(() => {
  producer(
    messageQueue,
    Math.floor(Math.random() * 5) + 1,
    `Message ${Math.random()}`
  );
}, 1000); // produce every 2 seconds
