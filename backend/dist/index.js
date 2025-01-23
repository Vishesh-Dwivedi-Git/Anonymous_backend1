"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
require('dotenv').config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8081;
// Enable CORS for HTTP requests
app.use((0, cors_1.default)());
// Middleware for parsing JSON (optional if you need to add HTTP POST/PUT endpoints)
app.use(express_1.default.json());
// Health check endpoint for HTTP
app.get("/", (req, res) => {
    res.status(200).send("HTTP and WebSocket server is running!");
});
// Example HTTP endpoint
app.get("/api", (req, res) => {
    res.status(200).json({ message: "Welcome to the API!" });
});
// Create HTTP server
const server = http_1.default.createServer(app);
// Create WebSocket server using the same HTTP server
const ws = new ws_1.WebSocketServer({ server });
// Store connected WebSocket clients
let allSockets = [];
ws.on("connection", (socket) => {
    console.log("New WebSocket connection established.");
    // Handle incoming WebSocket messages
    socket.on("message", (message) => {
        var _a;
        try {
            const parsedMessage = JSON.parse(message.toString());
            console.log("Received:", parsedMessage);
            if (parsedMessage.type === "join") {
                // User joins a room
                allSockets.push({ socket, room: parsedMessage.room });
                console.log(`User joined room: ${parsedMessage.room}`);
            }
            else if (parsedMessage.type === "chat") {
                // Broadcast chat messages to users in the same room
                const currentRoom = (_a = allSockets.find((s) => s.socket === socket)) === null || _a === void 0 ? void 0 : _a.room;
                if (currentRoom) {
                    console.log(`Broadcasting message to room: ${currentRoom}`);
                    allSockets.forEach((s) => {
                        if (s.room === currentRoom) {
                            s.socket.send(JSON.stringify({ type: "chat", message: parsedMessage.message }));
                        }
                    });
                }
                else {
                    console.log("User not found in any room.");
                }
            }
        }
        catch (err) {
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
