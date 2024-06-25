import axios from "axios";
import crc from "crc";
export class NodeManager {
  constructor(nodes, replicationFactor) {
    this.nodes = nodes;
    this.newNodes = nodes;
    this.replicationFactor = replicationFactor;
    this.aliveNodes = new Set(nodes);
    this.workAssignments = {};
    this.checkNodesStatus();
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
      for (const node of this.newNodes) {
        try {
          const response = await axios.get(`${node}/health`);
          if (response.status === 200) {
            aliveNodes.add(node);
          }
        } catch (error) {
          console.error(`Node ${node} is down`);
        }
      }
      const nodesWentDown = [...this.aliveNodes].filter(
        (node) => !aliveNodes.has(node)
      );
      const nodesCameUp = [...aliveNodes].filter(
        (node) => !this.nodes.includes(node)
      );

      if (nodesWentDown.length > 0) {
        this.redistributeWork(nodesWentDown, `down`);
        this.nodes = this.nodes.filter((node) => !nodesWentDown.includes(node));
      }

      if (nodesCameUp.length > 0) {
        this.redistributeWork(nodesCameUp, `up`);
        this.nodes.push(...nodesCameUp);
      }
      // console.log([...aliveNodes]);
      // console.log(this.aliveNodes);

      console.log(...nodesCameUp);
      // console.log(this.nodes);
      console.log(this.nodes);
      this.aliveNodes = aliveNodes; //update aliveNodes集合
    }, 3000);
  }
}
