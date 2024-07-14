import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import { connect } from "net";
dotenv.config();
const uri = process.env.MONGODB_SERVER;
//Connect URL
export class MongoDB {
  constructor(dbName) {
    this.url = uri;
    this.dbName = dbName;
    this.client = new MongoClient(this.url, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    this.db = null;
  }
  async connect() {
    if (!this.db) {
      try {
        await this.client.connect();
        console.log("Connect successfully to MongoDB");
        this.db = this.client.db(this.dbName);
      } catch (error) {
        console.error("Failed to connect MongoDB", error);
      }
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
