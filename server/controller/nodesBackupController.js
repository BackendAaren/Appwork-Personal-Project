import { MessageQueue, MessageType } from "./messageQueue.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;
const host = process.env.SERVER_HOST;

//Initialize Primary Node & BackupNodes set
let nodes = [host];
let backupNodes = [];
//Initialize Message Queue & NodeManager
const messageQueue = new MessageQueue(process.env.SERVER_HOST, PORT);
//Primary Nodes Backup
export const nodesBackup = async (req, res) => {
  try {
    const { channel } = req.params;
    const { message } = req.body;
    console.log(message);
    if (!message) {
      return res
        .status(400)
        .json({ error: " Backup messageType and payload are required" });
    }
    await messageQueue.nodesBackup(message, channel);
  } catch (error) {
    console.error("Failed to insert backup data in (server.js)");
  }
};

//Synchronize Update backup nodes information
export const updateBackupNodes = async (req, res) => {
  try {
    const { channel } = req.params;
    const { messageID } = req.body;
    await messageQueue.updateBackupNodeStatus(channel, messageID);
  } catch (error) {
    console.error("Failed to update backup node status");
  }
};
//Backup nodes promoted  data recover
export const backupNodeRecoverMessage = async (req, res) => {
  try {
    await messageQueue.recoverMessagesFromMongoDB();
  } catch (error) {
    console.error(`Backup node failed to recover message (server.js)`);
  }
};
