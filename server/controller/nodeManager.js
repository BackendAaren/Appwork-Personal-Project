import axios from "axios";
import crc from "crc";
import { WebSocket } from "ws";

export class NodeManager {
  constructor(nodes, backupNodes, replicationFactor, port) {
    this.nodes = nodes;
    this.backupNodes = backupNodes;
    this.allNodes = [...nodes, ...backupNodes];
    this.replicationFactor = replicationFactor;
    this.aliveNodes = new Set();
    this.primaryExecuteNodes = [];
    this.workAssignments = {};
    this.primaryToBackupMap = this.createPrimaryToBackupMap(nodes, backupNodes);
    this.primaryNodesSet = new Set(nodes); // 新增主節點集合
    this.wentDownNodes = {};
    this.checkNodesStatus();
    this.sendNodeCameUpNotification(port);

    this.wsClient = new WebSocket("ws://localhost:3008", {
      headers: { source: port },
    });
    this.wsClient.on("open", () => {
      console.log("Connected to Watcher server");
    });

    this.wsClient.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    setInterval(() => {
      this.sendNodeStatsToWatcher();
    }, 4000);
  }

  sendNodeStatsToWatcher() {
    if (this.wsClient.readyState === WebSocket.OPEN) {
      const nodeStats = this.sendNodeStatusToNodeWatcher();
      this.wsClient.send(JSON.stringify(nodeStats));
    } else {
      console.error("WebSocket connection is not open");
    }
  }

  createPrimaryToBackupMap(nodes, backupNodes) {
    return nodes.reduce((map, node, index) => {
      map.set(node, backupNodes[index]);
      map.set(backupNodes[index], node);
      return map;
    }, new Map());
  }

  hashNode(key) {
    return crc.crc16(key);
  }

  getNodeForKey(key) {
    const hashedKey = this.hashNode(key);
    const nodeIndex = hashedKey % this.nodes.length;
    return this.nodes[nodeIndex];
  }

  //獲取可用節點列表
  getAvailableNodes(key) {
    const hashedKey = this.hashNode(key);
    const nodeIndex = hashedKey % this.nodes.length;
    const availableNode = [];
    for (let i = 0; i < this.replicationFactor; i++) {
      const index = (nodeIndex + i) % this.nodes.length;
      availableNode.push(this.nodes[index]);
    }
    return availableNode;
  }

  //將message複製到指定節點

  replicateMessage(node, channel, message) {
    axios
      .post(`${node}/enqueue/${channel}`, message)
      .then((response) => {
        console.log(`Message replicated to ${node} successfully`);
      })
      .catch((error) => {
        console.error(`Failed to replicate message to ${node}`, error.message);
      });
  }

  redistributeWork(nodes, operation) {
    for (const node of nodes) {
      console.log(
        `Node ${node} ${
          operation === "down" ? "went down" : "came up"
        }. Redistributing its work...`
      );
      for (const [channel, assignedNode] of Object.entries(
        this.workAssignments
      )) {
        if (assignedNode === node) {
          if (operation === `down`) {
            const newAssignedNode = this.getNodeForKey(channel);
            this.workAssignments[channel] = newAssignedNode;
            console.log(
              `Channel ${channel} reassigned from ${node} to ${newAssignedNode}`
            );
          } else if (operation === `up`) {
            const newAssignedNode = this.getNodeForKey(channel);
            this.workAssignments[channel] = newAssignedNode;
            console.log(`Channel ${channel} now includes ${newAssignedNode}`);
          }
        }
      }
    }
  }

  checkNodesStatus() {
    setInterval(async () => {
      const aliveNodes = new Set();

      for (const node of this.allNodes) {
        try {
          const response = await axios.get(`${node}/health`);
          if (response.status === 200) {
            aliveNodes.add(node);
          }
        } catch (error) {
          // console.error(`Node ${node} is down`);
        }
      }
      const nodesWentDown = [...this.allNodes].filter(
        (node) => !aliveNodes.has(node)
      );

      if (nodesWentDown.length > 0) {
        this.promoteBackupNodes(nodesWentDown);
      }
      console.log(`這是nodesWentDown:${nodesWentDown}`);
      console.log(this.nodes);

      this.aliveNodes = aliveNodes; //update aliveNodes集合
    }, 6000);
  }

  async promoteBackupNodes(downNodes) {
    // console.log(`這是downNodes:${downNodes}`);
    for (const node of downNodes) {
      // console.log(`這是Node:${node}`);
      const backupNode = this.primaryToBackupMap.get(node);
      // console.log(`這是backup ${backupNode}`);
      // console.log(`這是backuppppp ${backupNode}`);
      if (backupNode && !this.nodes.includes(backupNode)) {
        //這一行邏輯怪怪的
        if (this.aliveNodes.has(backupNode)) {
          const index = this.nodes.indexOf(node);
          this.nodes.splice(index, 0, backupNode);
        }
        // console.log(`這是nodeManager的backupNode:${backupNode}`);
        if (this.aliveNodes.has(backupNode)) {
          await axios.post(`${backupNode}/backupNodeRecoverMessage`);
        }
        // this.nodes = this.nodes.filter((node) => !downNodes.includes(node));
        this.backupNodes = this.backupNodes.filter((bn) => bn != backupNode); //更新backupNodes節點列表
      }
    }
    console.log(`這是Promote的this.nodes:${this.nodes}`);
    this.nodes = this.nodes.filter((node) => !downNodes.includes(node));
    this.backupNodes = this.backupNodes.filter(
      (node) => !downNodes.includes(node)
    );
  }
  async restoreBackupNodes(cameUpNodes) {
    try {
      // 同步最新的主節點信息
      const primaryNodeUrl = this.primaryToBackupMap.get(cameUpNodes); // 假設第一個主節點URL
      try {
        const response = await axios.get(`${primaryNodeUrl}/status`);

        if (response) {
          const { primaryNodes } = response.data;
          console.log(primaryNodes);
          this.nodes = primaryNodes;
          console.log(`Fetched primary nodes from ${primaryNodeUrl}`);
        } else {
          console.log(`${primaryNodeUrl} is not alive`);
        }

        const primaryNode = this.primaryToBackupMap.get(cameUpNodes);
        if (this.nodes.includes(primaryNode)) {
          // 如果主節點仍在運行，將恢復的節點重新設置為從節點
          if (!this.backupNodes.includes(cameUpNodes)) {
            this.backupNodes.push(cameUpNodes);
          }
          console.log(
            `Node ${cameUpNodes} restored as a backup for ${primaryNode}`
          );
        } else {
          // 如果主節點不在運行，將恢復的節點設置為主節點
          this.nodes.push(cameUpNodes);
          console.log(`Node ${cameUpNodes} promoted to primary`);
        }
      } catch (error) {
        console.error(`Error fetching primary nodes from ${primaryNodeUrl}:`);
        for (const node of this.allNodes) {
          if (node !== cameUpNodes) {
            const response = await axios.get(`${node}/status`);
            if (response) {
              const { primaryNodes } = response.data;
              console.log(primaryNodes);
              this.nodes = primaryNodes;
              console.log(`success to update this.nodes from ${node}`);
              if (!this.nodes.includes(cameUpNodes)) {
                this.nodes.push(cameUpNodes);
                console.log(`Node ${cameUpNodes} promoted to primary`);
              }
            }
          }
        }
      }

      // 確保 this.nodes 更新到最新狀態
      this.nodes = Array.from(new Set(this.nodes));

      console.log("Final primary nodes list:", this.nodes);
    } catch (error) {
      console.error("Error in restoreBackupNodes:");
    }
  }
  //When Node alive notify  other nodes in cluster to make each node can synchronize information
  async sendNodeCameUpNotification(node) {
    for (const targetNode of this.allNodes) {
      if (targetNode !== node) {
        try {
          await axios.post(`${targetNode}/nodeCameUp`, { node });
          console.log(`Notified ${targetNode} of node ${node} coming up`);
        } catch (error) {
          console.error(
            `Failed to notified ${targetNode} of node ${node} coming up`,
            error.message
          );
        }
      } else {
        try {
          this.restoreBackupNodes(node);
          console.log(`Update ${node} node information to the most newest `);
        } catch (error) {
          console.error(`Failed to restore backup node:${node}`, error);
        }
      }
    }
  }
  //Receive CameUp node information to restore the node
  async receiveNodeCameUpNotification(cameUpNode) {
    console.log(`Receive notification that node ${cameUpNode} came up`);
    this.restoreBackupNodes(cameUpNode);
  }

  getPrimaryNodes() {
    return this.nodes; // 返回主節點列表
  }

  getCurrentAliveNodes() {
    return this.aliveNodes;
  }

  sendNodeStatusToNodeWatcher() {
    this.backupNodes = this.allNodes.filter(
      (node) => !this.nodes.includes(node) && this.aliveNodes.has(node)
    );
    this.wentDownNodes = this.allNodes.filter(
      (node) => !this.aliveNodes.has(node)
    );
    return {
      primaryNodes: this.nodes,
      backupNodes: this.backupNodes,
      wentDownNodes: this.wentDownNodes,
      primaryBackupNodes: this.primaryToBackupMap,
    };
  }
}
