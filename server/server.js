import http from "http";
import { WebSocketServer } from "ws";
import osUtils from "node-os-utils";
import path from "path";
import { fileURLToPath } from "url"; // 引入 fileURLToPath
import { dirname } from "path"; // 引入 dirname

import express from "express";
import bodyParser from "body-parser";
// Import MessageQueue and MessageType classes
import { MessageQueue, MessageType } from "./controller/messageQueue.js";
// 取得目前模組的檔案路徑
const __filename = fileURLToPath(import.meta.url);
// 從檔案路徑中取得目錄路徑
const __dirname = dirname(__filename);
const app = express();
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));
//http server

// Middleware
app.use(bodyParser.json());
// Initialize MessageQueue instance
const messageQueue = new MessageQueue();

// wss.on("connection", (ws) => {
//   messageQueue.handleMonitorClient(ws); // 將 WebSocket 連線交給 MessageQueue 類別處理
// });

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

// Route to acknowledge a message
app.post("/ack/:channel/:messageID", async (req, res) => {
  const { channel, messageID } = req.params;
  try {
    const success = await messageQueue.ack(channel, messageID);
    if (success) {
      res.status(200).send({
        message: "Message acknowledged successfully",
        SuccessMessage: `${success}`,
      });
    } else {
      res.status(404).send({
        message: "Message can't be found",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "Failed to acknowledge message",
      details: error.message,
    });
  }
});

app.get("/watcher/operationSystemStatus", async (req, res) => {
  const cpuUsage = await osUtils.cpu.usage().then((cpuPercentage) => {
    return cpuPercentage;
  });

  const memUsage = await osUtils.mem.info().then((memInfo) => {
    console.log("Total Memory:", memInfo.totalMemMb, "MB");
    console.log("Free Memory:", memInfo.freeMemMb, "MB");
    console.log("Used Memory:", memInfo.usedMemMb, "MB");
    return memInfo;
  });

  res.status(200).send({ cpuUsage, memUsage });
});

app.get("/watcher.html", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "public", "watcher.html"));
});

// Create HTTP server and attach express app to it
const server = http.createServer(app);

// Create WebSocket server and attach it to the HTTP server
const wss = new WebSocketServer({ server });

// Listen for WebSocket connections
wss.on("connection", (ws) => {
  messageQueue.handleMonitorClient(ws); // 將 WebSocket 連線交給 MessageQueue 類別處理
});

// Start server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
