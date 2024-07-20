// import { MessageQueue, MessageType } from "./messageQueue.js";
// import { NodeManager } from "./nodeManager.js";
// import dotenv from "dotenv";
// import axios from "axios";
// dotenv.config();

// const PORT = process.env.PORT;
// const host = process.env.SERVER_HOST;

// //Initialize Primary Node & BackupNodes set
// let nodes = [host];
// let backupNodes = [];
// const replicationFactor = 3;
// //Initialize Message Queue & NodeManager
// let nodeManager = new NodeManager(nodes, backupNodes, replicationFactor, host);
// const messageQueue = new MessageQueue(process.env.SERVER_HOST, PORT);
import { messageQueue, nodeManager } from "./initialize.js";

//Enqueue Function
export const enqueue = async (req, res) => {
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
};
