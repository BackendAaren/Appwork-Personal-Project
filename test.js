// function sum(num) {
//   return ((1 + num) * num) / 2;
// }

// console.log(sum(10));

// class Node {
//   constructor(item) {
//     this.value = item;
//     this.next = null;
//   }
// }

// class LinkedList {
//   constructor() {
//     this.head = null;
//   }

//   countNodes() {
//     let totalNodes = 0;
//     let currentNode = this.head;
//     let count = 1;
//     if (!this.head) {
//       return 0;
//     }
//     while (currentNode.next) {
//       count += 1;
//       currentNode = currentNode.next;
//     }
//     return count;
//   }

//   append(item) {
//     const node = new Node(item);

//     if (!this.head) {
//       this.head = node;
//     }
//     let currentNode = this.head;
//     while (currentNode.next) {
//       currentNode = currentNode.next;
//       return currentNode;
//     }
//     currentNode = node;
//   }

//   prepend(item) {
//     const newNode = new Node(item);
//     if (!this.head) {
//       this.node = newNode;
//       return;
//     }
//     newNode.next = this.head;
//     this.head = newNode;
//   }

//   get(index) {}

//   insertAt(item, index) {}

//   removeAt(index) {}
// }

// // / Test

// const list = new LinkedList();
// list.append(1);
// list.prepend(2);
// list.prepend(3);
// console.log(list.countNodes()); // 3

// let arr = [7, 63, 13, 47, 28, 50, 1];

// function finMiddleNum(arr, target) {
//   for (let i = 0; i < arr.length; i++) {
//     if (arr[i] === target) {
//       return true;
//     }
//   }
//   return false;
// }

// console.log(finMiddleNum(arr, 47));

// function getSum(num) {
//   if (num === 0) return 0;
//   if (num === 1) return 1 + getSum(0);
//   return num + getSum(num - 1);
// }

// console.log(getSum(10));

// let arr = [1, 2, 3, 4, 5];
// console.log(arr);
// arr.push(6);
// console.log(arr);
import dotenv from "dotenv";
dotenv.config();
let arr = "1,2,3,4,5,6,7";
const clusterNodes = process.env.NODE_PRIMARYNODES.split(",");
// const backupNodes = process.env.BACKUP_NODES.split(',');

console.log("Cluster Nodes:", clusterNodes);
console.log(typeof process.env.SERVER_HOST);
// console.log('Backup Nodes:', backupNodes);
