import { MongoClient } from "mongodb";
import { connect } from "net";

//Connect URL
export class MongoDB {
  constructor(url, dbName) {
    this.url = url;
    this.dbName = dbName;
    this.client = new MongoClient(this.url);
    this.db = null;
  }
  async connect() {
    if (!this.db) {
      await this.client.connect();
      console.log("Connect successfully to MongoDB");
      this.db = this.client.db(this.dbName);
    }
    return this.db;
  }

  getCollection(collectionName) {
    if (!this.db) {
      throw new Error("Database not connected. Please call connect first");
    }
    return this.db.collection(collectionName);
  }

  async close() {
    if (this.client.isConnected) {
      await this.client.close();
      console.log("MongoDB connect closed");
    }
  }
}
