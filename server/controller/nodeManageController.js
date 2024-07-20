import { NodeManager } from "./nodeManager.js";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const PORT = process.env.PORT;
const host = process.env.SERVER_HOST;

let nodeManager = new NodeManager(nodes, backupNodes, replicationFactor, host);

export const checkNodeHealth = async (req, res) => {
  const currentAliveNodes = nodeManager.getCurrentAliveNodes(); // 確保這裡是調用函數
  res.status(200).json({ currentAliveNodes: currentAliveNodes }); // 使用 .json() 方法
};

export const checkNodeStatus = async (req, res) => {
  const primaryNodeStatus = nodeManager.getPrimaryNodes(); // 確保這裡是調用函數
  res.status(200).json({ primaryNodes: primaryNodeStatus }); // 使用 .json() 方法
};
1;

export const receiveNodesCameUp = async (rea, res) => {
  const { node } = req.body;
  nodeManager.receiveNodeCameUpNotification(node);
  res.send(200);
};
