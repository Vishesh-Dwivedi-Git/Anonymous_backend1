import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import cors from "cors";
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8081;

// Enable CORS for HTTP requests
app.use(cors());

// Middleware for parsing JSON (optional if you need to add HTTP POST/PUT endpoints)
app.use(express.json());

// Health check endpoint for HTTP
app.get("/", (req, res) => {
  res.status(200).send("HTTP and WebSocket server is running!");
});

// Example HTTP endpoint
app.get("/api", (req, res) => {
  res.status(200).json({ message: "Welcome to the API!" });
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server using the same HTTP server
const ws = new WebSocketServer({ server });

interface User {
  socket: WebSocket;
  room: string;
}

// Store connected WebSocket clients
let allSockets: User[] = [];

ws.on("connection", (socket) => {
  console.log("New WebSocket connection established.");

  // Handle incoming WebSocket messages
  socket.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      console.log("Received:", parsedMessage);

      if (parsedMessage.type === "join") {
        // User joins a room
        allSockets.push({ socket, room: parsedMessage.room });
        console.log(`User joined room: ${parsedMessage.room}`);
      } else if (parsedMessage.type === "chat") {
        // Broadcast chat messages to users in the same room
        const currentRoom = allSockets.find((s) => s.socket === socket)?.room;

        if (currentRoom) {
          console.log(`Broadcasting message to room: ${currentRoom}`);
          allSockets.forEach((s) => {
            if (s.room === currentRoom) {
              s.socket.send(
                JSON.stringify({ type: "chat", message: parsedMessage.message })
              );
            }
          });
        } else {
          console.log("User not found in any room.");
        }
      }
    } catch (err) {
      console.error("Invalid message format:", err);
    }
  });

  // Handle WebSocket disconnection
  socket.on("close", () => {
    allSockets = allSockets.filter((s) => s.socket !== socket);
    console.log("Socket disconnected, removed from rooms.");
  });

  // Handle WebSocket errors
  socket.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`HTTP and WebSocket server running on port ${port}`);
});
