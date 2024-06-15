import net from "net";

class SimpleMessageQueue {
  constructor() {
    this.queue = [];
    this.server = net.createServer();
  }

  start(port) {
    this.server.on("connection", (socket) => {
      console.log("Client connected");

      socket.on("data", (data) => {
        const message = data.toString().trim();
        console.log(`Received from client: ${message}`);
        this.produce(message);
      });

      socket.on("end", () => {
        console.log("Client disconnected");
      });

      socket.on("error", (err) => {
        console.error("Socket error:", err);
      });
    });

    this.server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }

  produce(message) {
    try {
      if (Math.random() > 0.7) {
        throw new Error("Produce error");
      }
      this.queue.push(message);
      console.log(`Produced: ${message}`);
    } catch (error) {
      console.error("Failed to produce message:", error);
    }
  }

  consumed() {
    while (this.queue.length > 0) {
      let message = this.queue.shift();
      console.log(`Consumed: ${message}`);
    }
  }
}

const server = new SimpleMessageQueue();
const port = 6001;
server.start(port);
