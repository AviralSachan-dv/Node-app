const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS and other production settings
const io = socketIO(server, {
  cors: {
    origin: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  path: '/api/socketio' // Add this for Vercel
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Add a catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// For Vercel serverless deployment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || '0.0.0.0';
  server.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express API
module.exports = app;
