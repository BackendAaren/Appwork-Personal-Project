import { MessageQueue, MessageType } from "./messageQueue.js";
import { NodeManager } from "./nodeManager.js";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const PORT = process.env.PORT;
const host = process.env.SERVER_HOST;

//Initialize Primary Node & BackupNodes set
let nodes = [host];
let backupNodes = [];
//Initialize Message Queue & NodeManager
let nodeManager = new NodeManager(nodes, backupNodes, replicationFactor, host);
const messageQueue = new MessageQueue(process.env.SERVER_HOST, PORT);

export const dequeue = async (req, res) => {
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
};
