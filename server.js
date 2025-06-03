const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Directly use the MongoDB URI
const MONGODB_URI = "mongodb+srv://Aviral:Avikr1996@chat-data.11nvnpo.mongodb.net/?retryWrites=true&w=majority&appName=chat-data";

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("A user connected");

  // Listen for new user joining
  socket.on("new user", (username) => {
    console.log(`${username} joined`);
    // Notify all other clients that a new user joined
    socket.broadcast.emit("user joined", username);
  });

  // Listen for chat messages and broadcast to everyone
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the server
const PORT = 3000; // Directly set the port number
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
