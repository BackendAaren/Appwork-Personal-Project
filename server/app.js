import http from "http";
import { WebSocketServer } from "ws";
import express from "express";
import dotenv from "dotenv";
import setNodes from "./router/setNodes_Router.js";
import enqueue from "./router/enqueueRouter.js";
import dequeue from "./router/dequeueRouter.js";
import ack from "./router/ackRouter.js";
import nodesBackup from "./router/nodesBackupRoter.js"; // 修改拼寫錯誤

dotenv.config();

const app = express();
app.use(express.json()); // Ensure you are using express.json() for parsing JSON bodies
app.use("/", setNodes);
app.use("/", enqueue);
app.use("/", dequeue);
app.use("/", ack);
app.use("/", nodesBackup);

// Create HTTP server and attach express app to it
const server = http.createServer(app);

// Create WebSocket server and attach it to the HTTP server
const wss = new WebSocketServer({ server });

// Listen for WebSocket connections
wss.on("connection", (ws) => {
  console.log("WebSocket connection established");
  // Assuming messageQueue is defined elsewhere and handleMonitorClient is a method on it
  // messageQueue.handleMonitorClient(ws);
});

// Define the port and start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
