import http from "http";
import WebSocket, { WebSocketServer } from "ws";

import express from "express";
import bodyParser from "body-parser";
// Import MessageQueue and MessageType classes
import { MessageQueue, MessageType } from "./controller/messageQueue.js";

const app = express();
//http server
const PORT = 3001;
const server = http.createServer();
//webSocket Server
const wss = new WebSocketServer({ server });
// 監聽 WebSocket 連線

// Middleware
app.use(bodyParser.json());

wss.on("connection", (ws) => {
  messageQueue.handleMonitorClient(ws); // 將 WebSocket 連線交給 MessageQueue 類別處理
});

// Initialize MessageQueue instance
const messageQueue = new MessageQueue();

// Route to enqueue a message to a specific channel
app.post("/enqueue/:channel", (req, res) => {
  const { channel } = req.params;
  const { messageType, payload } = req.body;

  if (!messageType || !payload) {
    return res
      .status(400)
      .json({ error: "messageType and payload are required" });
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

// Route to dequeue a message from a specific channel
app.get("/dequeue/:channel", async (req, res) => {
  const { channel } = req.params;

  try {
    const message = await messageQueue.dequeue(channel);
    console.log(messageQueue.getStats());
    res.status(200).json(message);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Start server
http.createServer(app).listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
