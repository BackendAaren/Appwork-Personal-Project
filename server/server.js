import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url"; // 引入 fileURLToPath
import { dirname } from "path"; // 引入 dirname
import axios from "axios";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
// Import MessageQueue and MessageType classes
import { MessageQueue, MessageType } from "./controller/messageQueue.js";
import { NodeManager } from "./controller/nodeManager.js";
import cluster from "cluster";
// 取得目前模組的檔案路徑
const __filename = fileURLToPath(import.meta.url);
// 從檔案路徑中取得目錄路徑
const __dirname = dirname(__filename);
const app = express();
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));
// Middleware
app.use(bodyParser.json());
//use dotenv
dotenv.config();
//設定port number
const PORT = process.env.PORT;
const host = process.env.SERVER_HOST;
// Initialize MessageQueue instance
//initialize nodeManager
let nodes = [host];
let backupNodes = [];
let allClusterNodes = [...nodes, ...backupNodes];
const replicationFactor = 3;
let nodeManager = new NodeManager(nodes, backupNodes, replicationFactor, host);
const messageQueue = new MessageQueue(process.env.SERVER_HOST, PORT);

//Receive and setting nodes&backupNods for cluster node

app.post("/set-nodes", async (req, res) => {
  try {
    const { nodes: newNodes, backupNodes: newBackupNodes } = req.body;
    console.log("This is", newNodes);
    console.log(newBackupNodes);
    if (!newNodes || !newBackupNodes) {
      return res
        .status(400)
        .json({ error: "nodes and backupNodes are requires" });
    }
    // const clusterNodes = [...newNodes, ...newBackupNodes];
    // allClusterNodes = [...newNodes, newBackupNodes];
    // console.log("這是clusterNodes", clusterNodes);
    // console.log("這是allClusterNodes", allClusterNodes);

    // for (const clusterNode of clusterNodes) {
    //   if (clusterNode !== host && !allClusterNodes.includes(clusterNode)) {
    //     await axios.post(`${clusterNode}/set-nodes`, {
    //       nodes: newNodes,
    //       backupNodes: newBackupNodes,
    //     });
    //   }
    // }
    nodes = newNodes;
    backupNodes = newBackupNodes;
    // allClusterNodes = [...newNodes, newBackupNodes];
    nodeManager.updateNode(newNodes, newBackupNodes, process.env.SERVER_HOST);
    res
      .status(200)
      .json({ message: "Nodes and backup nodes update successfully " });
  } catch (error) {
    console.error("Sets nodes error", error);
    res.status(500).json({ error: "Internal server error", details: error });
  }
});

// Route to enqueue a message to a specific channel
app.post("/enqueue/:channel", async (req, res) => {
  try {
    const { channel } = req.params;
    const { messageType, payload } = req.body;

    if (!messageType || !payload) {
      return res
        .status(400)
        .json({ error: "messageType and payload are required" });
    }

    const node = nodeManager.getNodeForKey(channel);
    const message = new MessageType(channel, messageType, payload, node);
    // 更新工作分配
    nodeManager.workAssignments[channel] = node;
    if (node === process.env.SERVER_HOST) {
      const bkNode = nodeManager.primaryToBackupMap.get(node);
      const backupURL = `${bkNode}/backup/${channel}`;
      await messageQueue.enqueue(channel, message);
      await axios.post(backupURL, { message });
    } else {
      const bkNode = nodeManager.primaryToBackupMap.get(node);
      const backupURL = `${bkNode}/backup/${channel}`;
      const targetURL = `${node}/enqueue/${channel}`;
      await axios.post(targetURL, { messageType, payload });
      await axios.post(backupURL, { messageType, message });
    }

    res.status(200).json({ message: "Message enqueue successfully" });
  } catch (error) {
    console.error("Enqueue error:");
    res.status(500).json({ error: "Internal server error" });
  }
  console.log(messageQueue.getStats());
});

// Route to dequeue a message from a specific channel
app.get("/dequeue/:channel", async (req, res) => {
  const { channel } = req.params;
  const node = nodeManager.getNodeForKey(channel);
  console.log(`這是server Side 的連接node: ${node}`);

  try {
    if (node === process.env.SERVER_HOST) {
      const message = await messageQueue.dequeue(channel);
      const bkNode = nodeManager.primaryToBackupMap.get(node);
      const backupURL = `${bkNode}/updateBackupNode/${channel}`;
      await axios.post(backupURL, { messageID: message.messageID });
      res.status(200).json(message);
    } else {
      const targetURL = `${node}/dequeue/${channel}`;
      const response = await axios.get(targetURL);
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error("Dequeue error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }

  console.log(messageQueue.getStats());
});

//Nodes backup
app.post("/backup/:channel", async (req, res) => {
  try {
    const { channel } = req.params;
    const { message } = req.body;
    console.log(message);

    if (!message) {
      return res
        .status(400)
        .json({ error: " Backup messageType and payload are required" });
    }

    // const message = new MessageType(channel, messageType, payload);
    await messageQueue.nodesBackup(message, channel);
  } catch (error) {
    console.error("Failed to insert backup data in (server.js)");
  }
});

app.post("/updateBackupNode/:channel", async (req, res) => {
  try {
    const { channel } = req.params;
    const { messageID } = req.body;
    await messageQueue.updateBackupNodeStatus(channel, messageID);
  } catch (error) {
    console.error("Failed to update backup node status");
  }
});

app.post("/backupNodeRecoverMessage", async (req, res) => {
  try {
    await messageQueue.recoverMessagesFromMongoDB();
  } catch (error) {
    console.error(`Backup node failed to recover message (server.js)`);
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

app.get(`/health`, (req, res) => {
  const currentAliveNodes = nodeManager.getCurrentAliveNodes(); // 確保這裡是調用函數
  res.status(200).json({ currentAliveNodes: currentAliveNodes }); // 使用 .json() 方法
});

app.get(`/status`, (req, res) => {
  const primaryNodeStatus = nodeManager.getPrimaryNodes(); // 確保這裡是調用函數
  res.status(200).json({ primaryNodes: primaryNodeStatus }); // 使用 .json() 方法
});

app.post(`/nodeCameUp`, (req, res) => {
  const { node } = req.body;
  nodeManager.receiveNodeCameUpNotification(node);
  res.send(200);
});

// Create HTTP server and attach express app to it
const server = http.createServer(app);
// Create WebSocket server and attach it to the HTTP server
const wss = new WebSocketServer({ server });
// Listen for WebSocket connections
wss.on("connection", (ws) => {
  messageQueue.handleMonitorClient(ws); // 將 WebSocket 連線交給 MessageQueue 類別處理
});

server.listen(PORT, () => {
  console.log(`Server is running on ${process.env.SERVER_HOST}`);
});
