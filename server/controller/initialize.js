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
const replicationFactor = 3;
//Initialize Message Queue & NodeManager
export let nodeManager = new NodeManager(
  nodes,
  backupNodes,
  replicationFactor,
  host
);
export const messageQueue = new MessageQueue(process.env.SERVER_HOST, PORT);
