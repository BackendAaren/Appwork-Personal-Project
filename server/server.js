import http from "http";

import express from "express";
import bodyParser from "body-parser";

const app = express();
const PORT = 3001;

// Middleware
app.use(bodyParser.json());

// Import MessageQueue and MessageType classes
import { MessageQueue, MessageType } from "./controller/messageQueue.js";

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
    console.log(message);
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
