import https from "https";

export class MessageType {
  constructor(channel, messageType, payload) {
    this.channel = channel;
    this.messageType = messageType;
    this.payload = payload;
  }
}

export class MessageQueue {
  constructor(port) {
    this.port = port;
    this.server = https.createServer(this.handleHttpsRequest.bind(this));
    this.server.listen(this.port, () => {
      console.log(`Message Queue server listening on port ${this.port}`);
    });
    this.messageQueue = {};
  }

  async enqueue(channel, message) {
    if (!this.messageQueue[channel]) {
      this.messageQueue[channel] = [];
    }
    this.messageQueue[channel].push(message);
  }

  async dequeue(channel) {
    if (
      !this.messageQueue[channel] ||
      this.messageQueue[channel].length === 0
    ) {
      return null;
    }
    return this.messageQueue[channel].shift();
  }

  async handleHttpsRequest(req, res) {
    if (req.method === "POST" && req.url === "/enqueue") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString(); // accumulate the request body
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          const { channel, messageType, payload } = data;
          const message = new MessageType(channel, messageType, payload);
          this.enqueue(channel, message);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ status: "success", message: "Message enqueued" })
          );
        } catch (error) {
          console.error("Error parsing request body:", error);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ status: "error", message: "Invalid request body" })
          );
        }
      });
    } else if (req.method === "GET" && req.url === "/dequeue") {
      const channel = req.headers["channel"];
      if (!channel) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ status: "error", message: "Channel header missing" })
        );
        return;
      }
      const message = await this.dequeue(channel);
      if (message) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(message));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ status: "error", message: "No message available" })
        );
      }
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: "Not found" }));
    }
  }
}

const https = require("https");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

const options = {
  key: fs.readFileSync("server-key.pem"),
  cert: fs.readFileSync("server-cert.pem"),
};

// Middleware
app.use(bodyParser.json());

// Import MessageQueue and MessageType classes
const { MessageQueue, MessageType } = require("./messageQueue");

// Initialize MessageQueue instance
const messageQueue = new MessageQueue();

// Route to enqueue a message
app.post("/enqueue", (req, res) => {
  const { channel, messageType, payload } = req.body;

  if (!channel || !messageType || !payload) {
    return res
      .status(400)
      .json({ error: "Channel, messageType, and payload are required" });
  }

  const message = new MessageType(channel, messageType, payload);

  messageQueue
    .enqueue(channel, message)
    .then(() =>
      res.status(200).json({ message: "Message enqueued successfully" })
    )
    .catch((error) =>
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message })
    );
});

// Route to dequeue a message
app.get("/dequeue/:channel", async (req, res) => {
  const { channel } = req.params;

  try {
    const message = await messageQueue.dequeue(channel);
    res.status(200).json(message);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Start server
https.createServer(options, app).listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
