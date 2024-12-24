const express = require("express");
require("dotenv").config();
const { connect } = require("./connection");
const { Server } = require("socket.io");
const { createServer } = require("http");
const { authRouter } = require("./route/auth-route");
const app = express();
const server = createServer(app);
const cors = require("cors");
const { userRouter } = require("./route/user-route");
const { Message } = require("./model/messageModel");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
// const bodyParser = require("body-parser");
// app.use(bodyParser.json({ limit: "50mb" })); // Adjust the size limit as needed

// Increase body size limit for url-encoded data
// app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

connect();

// Add CORS Middleware before routes and socket.io setup
const allowedOrigins = [
  "https://chat-ui-va8r.vercel.app", // Your production frontend URL
  "http://localhost:5173", // Your local frontend URL for development
];

app.use(
  cors({
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
    exposedHeaders: "*",
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: allowedOrigins, // Allow requests from these origins
//     methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
//     credentials: true, // Allow credentials (cookies, authorization headers, etc.)
//     // allowedHeaders: true,
//     // allowedHeaders: true,
//   })
// );

const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Same CORS origin rules for WebSocket
    methods: ["GET", "POST"],
    credentials: true,
    // allowedHeaders: true,
    // allowedOrigins: true,
  },
});

app.use(express.json({ limit: "50mb" }));

app.use("/api/auth", authRouter);
app.use("/api", userRouter);

io.on("connection", (socket) => {
  console.log(`Socket Created`);

  socket.on("offer", ({ offer, roomId }) => {
    socket.broadcast.to(roomId).emit("offer", { offer, roomId });
  });

  socket.on("answer", ({ answer, roomId }) => {
    socket.to(roomId).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ candidate, roomId }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  socket.on("typing", (data) => {
    const sortedIds = [data.sender, data.receiver].sort().join("_");
    socket.to(sortedIds).emit("typingIndicator", data.sender);
  });

  socket.on("notTyping", (data) => {
    socket.broadcast.emit("notTypingIndicator", data.sender);
  });

  socket.on("joinRoom", async (data) => {
    try {
      const sortedIds = [data.sender, data.receiver].sort().join("_");
      io.to(sortedIds).emit("online", data.sender);
      socket.join(sortedIds);

      const response = await Message.find({ room: sortedIds }).sort({
        timestamp: 1,
      });

      socket.emit("chatHistory", { messages: response });
      console.log(`${socket.id} joined room: ${sortedIds}`);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  });

  socket.on("sendMessage", async (data) => {
    try {
      const sortedIds = [data.sender, data.receiver].sort().join("_");
      const msg = new Message({
        room: sortedIds,
        sender: data.sender,
        receiver: data.receiver,
        message: data.message,
      });

      await msg.save();
      io.to(sortedIds).emit("receiveMessage", msg);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    socket.broadcast.emit("offline", { id: socket.id });
    socket.emit("clearLocalStorage");
  });
});

server.listen(3000, () => {
  console.log(`Server running on port 3000`);
});
