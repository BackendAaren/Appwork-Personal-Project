import axios from "axios";
import crc from "crc";
export class NodeManager {
  constructor(nodes, backupNodes, replicationFactor) {
    this.nodes = nodes;
    this.backupNodes = backupNodes;
    this.allNodes = [...nodes, ...backupNodes];
    this.replicationFactor = replicationFactor;
    this.aliveNodes = new Set();
    this.primaryExecuteNodes = [];
    this.workAssignments = {};
    this.primaryToBackupMap = this.createPrimaryToBackupMap(nodes, backupNodes);
    this.primaryNodesSet = new Set(nodes); // 新增主節點集合
    this.checkNodesStatus();
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
      console.log(`這是nodesCameUp測試${[...aliveNodes]}`);
      const nodesCameUp = [...aliveNodes].filter(
        (node) => !this.aliveNodes.has(node)
      );

      if (nodesWentDown.length > 0) {
        this.promoteBackupNodes(nodesWentDown);
        // this.redistributeWork(nodesWentDown, `down`);
        // this.nodes = this.nodes.filter((node) => !nodesWentDown.includes(node));
      }

      if (nodesCameUp.length > 0) {
        // console.log(`5wefwerfwe :${this.nodes}`);
        // this.redistributeWork(nodesCameUp, `up`);
        this.restoreBackupNodes(nodesCameUp);
        for (const node of nodesCameUp) {
          // console.log(`我是checkstatus的復活點${node}`);
          // this.nodes.push(node);
        }
      }
      // console.log(`這是this.aliveNodes${this.aliveNodes}`);
      // console.log(`這是aliveNodes${[...aliveNodes]}`);
      // console.log(this.aliveNodes);
      console.log(`這是nodesWentDown:${nodesWentDown}`);
      console.log(`這是nodesCameUp:${nodesCameUp}`);
      // console.log(`這是this.backupNodes:${this.backupNodes}`);
      console.log(this.nodes);
      // console.log(this.primaryToBackupMap);
      // // console.log(this.allNodes);

      this.aliveNodes = aliveNodes; //update aliveNodes集合
    }, 10000);
  }

  promoteBackupNodes(downNodes) {
    for (const node of downNodes) {
      const backupNode = this.primaryToBackupMap.get(node);
      // console.log(`這是backup ${downNodes}`);
      // console.log(`這是backuppppp ${backupNode}`);
      if (backupNode && !this.nodes.includes(backupNode)) {
        if (this.aliveNodes.has(backupNode)) {
          this.nodes.push(backupNode);
          // this.backupNodes.push(node);
          // console.log(`我活過來囉 ${backupNode}`);
        }

        // this.nodes = this.nodes.filter((node) => !downNodes.includes(node));
        this.backupNodes = this.backupNodes.filter((bn) => bn != backupNode); //更新backupNodes節點列表
        // console.log(`Promoted backup node ${backupNode} to primary`);
        this.primaryNodesSet.delete(node); // 更新主節點集合
        this.primaryNodesSet.add(backupNode);
      }
      // this.primaryToBackupMap.set(backupNode, node);
      this.nodes = this.nodes.filter((node) => !downNodes.includes(node));
    }
  }
  async restoreBackupNodes(cameUpNodes) {
    try {
      console.log(`這是CameUpNodes${cameUpNodes}`);
      for (const node of cameUpNodes) {
        // 同步最新的主節點信息
        const primaryNodeUrl = this.primaryToBackupMap.get(node); // 假設第一個主節點URL

        console.log(`這是PrimaryNodeURL: ${primaryNodeUrl}`);

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

          const primaryNode = this.primaryToBackupMap.get(node);
          if (this.nodes.includes(primaryNode)) {
            // 如果主節點仍在運行，將恢復的節點重新設置為從節點
            this.backupNodes.push(node);
            console.log(`Node ${node} restored as a backup for ${primaryNode}`);
          } else {
            // 如果主節點不在運行，將恢復的節點設置為主節點
            this.nodes.push(node);
            console.log(`Node ${node} promoted to primary`);
          }
        } catch (error) {
          console.error(`Error fetching primary nodes from ${primaryNodeUrl}:`);
        }
      }

      // 確保 this.nodes 更新到最新狀態
      this.nodes = Array.from(new Set(this.nodes));
      console.log("Final primary nodes list:", this.nodes);
    } catch (error) {
      console.error("Error in restoreBackupNodes:");
    }
  }
  getPrimaryNodes() {
    return this.nodes; // 返回主節點列表
  }

  getCurrentAliveNodes() {
    return this.aliveNodes;
  }
}
