import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import express from "express";
import path from "path";
import { dirname } from "path"; // 引入 dirname
import { fileURLToPath } from "url"; // 引入 fileURLToPath
import bodyParser from "body-parser";

const app = express();
// 取得目前模組的檔案路徑
const __filename = fileURLToPath(import.meta.url);

// Start server

const __dirname = dirname(__filename);
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));
// Middleware
app.use(bodyParser.json());

const PORT = 3008;
// Create HTTP server and attach express app to it
const server = http.createServer(app);
// Create WebSocket server and attach it to the HTTP server
const wss = new WebSocketServer({ server });

const clients = new Map();

wss.on("connection", function connection(ws, req) {
  const source = req.headers["source"] || "default-source";
  ws.source = source;
  console.log(`Connection established from ${source}`);
  clients.set(ws, source);

  ws.on("message", function incoming(message) {
    try {
      const parsedMessage = JSON.parse(message);
      const messageToSend = JSON.stringify(parsedMessage);

      clients.forEach((clientSource, client) => {
        if (client.readyState === WebSocket.OPEN) {
          console.log(`Sending message ${messageToSend} to ${clientSource}`);
          client.send(messageToSend);
        }
      });
    } catch (error) {
      console.error("Failed to process message:", error);
    }
  });

  ws.on("close", function () {
    clients.delete(ws);
    console.log(`Connection from ${ws.source} closed`);
  });

  ws.on("error", function (error) {
    console.error("WebSocket error:", error);
  });
});

app.get("/watcher.html", (req, res) => {
  res.sendFile(path.join(__dirname, "watcher.html"));
});

server.listen(PORT, () => {
  console.log(`Watcher server is running on http://localhost:${PORT}`);
});
