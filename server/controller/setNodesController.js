import axios from "axios";
import dotenv from "dotenv";
import { NodeManager } from "./nodeManager.js";
dotenv.config();

const PORT = process.env.PORT;
const host = process.env.SERVER_HOST;
const replicationFactor = 3;

let nodes = [host];
let backupNodes = [];
let nodeManager = new NodeManager(nodes, backupNodes, replicationFactor, host);

export const setNodes = async (req, res) => {
  try {
    const { nodes: newNodes, backupNodes: newBackupNodes } = req.body;
    console.log("This is", newNodes);
    console.log(newBackupNodes);
    if (!newNodes || !newBackupNodes) {
      return res
        .status(400)
        .json({ error: "nodes and backupNodes are requires" });
    }
    const clusterNodes = [...newNodes, ...newBackupNodes];

    for (const clusterNode of clusterNodes) {
      if (clusterNode !== host) {
        try {
          await axios.post(`${clusterNode}/set_clusterNodes`, {
            nodes: newNodes,
            backupNodes: newBackupNodes,
          });
        } catch (error) {
          console.error(`${clusterNode} is not alive`);
        }
      }
    }
    nodes = newNodes;
    backupNodes = newBackupNodes;
    // allClusterNodes = [...newNodes, newBackupNodes];
    nodeManager.updateNode(nodes, backupNodes, process.env.SERVER_HOST);
    res
      .status(200)
      .json({ message: "Nodes and backup nodes update successfully " });
  } catch (error) {
    console.error("Sets nodes error", error);
    res.status(500).json({ error: "Internal server error", details: error });
  }
};

export const setClusterNodes = async (req, res) => {
  try {
    const { nodes: newNodes, backupNodes: newBackupNodes } = req.body;

    if (!newNodes || !newBackupNodes) {
      return res
        .status(400)
        .json({ error: "nodes and backupNodes are requires" });
    }
    nodes = newNodes;
    backupNodes = newBackupNodes;
    nodeManager.updateNode(nodes, backupNodes);
    res
      .status(200)
      .json({ message: "Nodes and backup nodes update successfully " });
  } catch (error) {
    console.error("Failed to update backupNodes");
    res.status(500).json({ error: "Internal server error" });
  }
};
