import { MongoDB } from "./server/model/mongodb.js";
async function insertDocument() {
  const url = "mongodb://localhost:27017";
  const dbName = "myMongoDB";
  const collectionName = "myCollection";

  const mongoDB = new MongoDB(url, dbName);

  try {
    await mongoDB.connect();
    const collection = mongoDB.getCollection(collectionName);
    const result = await collection.insertOne({
      name: "Aaren",
      age: 2,
      email: "alice@example.com",
      type: ["pretty", "sexy"],
    });
    console.log(`Insert document ${result}`);
  } catch {
    console.log("Error inserting document ", err);
  }
}
insertDocument();
// import osUtils from "node-os-utils";

// // 監控 CPU 使用率
// osUtils.cpu.usage().then((cpuPercentage) => {
//   console.log(`Current CPU Usage`, cpuPercentage);
// });

// // 監控記憶體使用量

// setInterval(() => {
//   osUtils.mem.info().then((memInfo) => {
//     console.log("Total Memory:", memInfo.totalMemMb, "MB");
//     console.log("Free Memory:", memInfo.freeMemMb, "MB");
//     console.log("Used Memory:", memInfo.usedMemMb, "MB");
//     console.log(memInfo);
//   });
// }, 1000);
