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
// const bodyParser = require("body-parser");
// app.use(bodyParser.json({ limit: "50mb" })); // Adjust the size limit as needed

// Increase body size limit for url-encoded data
// app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

connect();

// Add CORS Middleware b
// efore routes and socket.io setup
const allowedOrigins = [
  "https://chat-ui-2j8f.vercel.app/",
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

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api", userRouter);

const emailToSocketId = new Map();
const socketIdToEmail = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Created`);

  socket.on("register", ({ userId }) => {
    emailToSocketId.set(userId, socket.id);
    socketIdToEmail.set(socket.id, userId);

    console.log(
      `User with email ${socketIdToEmail.get(
        socket.id
      )} is now connected with socketId ${emailToSocketId.get(userId)}`
    );
  });

  socket.on("sendMessage", async ({ message, from, to }) => {
    try {
      const sortedIds = [from, to].sort().join("_");
      const msg = new Message({
        room: sortedIds,
        sender: from,
        receiver: to,
        message: message,
      });
      await msg.save();
      socket.to(emailToSocketId.get(to)).emit("receiveMessage", msg);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  });

  socket.on("fetchChatHistory", async ({ from, to }) => {
    const sortedIds = [from, to].sort().join("_");
    const response = await Message.find({ room: sortedIds }).sort({
      timestamp: 1,
    });
    socket.emit("chatHistory", { messages: response });
  });

  socket.on("typing", ({ from, to }) => {
    // const sortedIds = [data.sender, data.receiver].sort().join("_");
    socket.to(emailToSocketId.get(to)).emit("typingIndicator", { from });
  });

  socket.on("notTyping", ({ from, to }) => {
    socket.to(emailToSocketId.get(to)).emit("notTypingIndicator", { from });
  });

  socket.on("online", ({ from, to }) => {
    socket.to(emailToSocketId.get(to)).emit("online", { from });
  });

  socket.on("offline", ({ from, to }) => {
    socket.to(emailToSocketId.get(to)).emit("offline", { from });
  });

  socket.on("user:call", ({ from, to }) => {
    console.log("from,to");
    console.log(from, to);
    socket.to(emailToSocketId.get(to._id)).emit("call:incoming", { from });
  });

  socket.on("call:hangup", ({ from, to }) => {
    socket.to(emailToSocketId.get(to)).emit("call:hungup");
  });

  socket.on("user:call:cancel", ({ from, to }) => {
    socket.to(emailToSocketId.get(to)).emit("user:call:cancelled");
  });

  socket.on("user:call:pickup", ({ from, to }) => {
    socket.to(emailToSocketId.get(to)).emit("user:call:pickedUp", { from });
  });

  socket.on("offer", ({ from, to, offer }) => {
    console.log("offer interm->");
    console.log(offer, from);

    socket
      .to(emailToSocketId.get(to))
      .emit("user:offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ to, ans }) => {
    console.log("answer interm->");
    console.log(ans, to);
    socket.to(to).emit("answer", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("nego sent");
    socket.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("nego received");
    socket.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    socket.to(emailToSocketId.get(to)).emit("ice-candidate", candidate); // Relay ICE candidates
  });

  socket.on("joinRoom", async (data) => {
    try {
      const sortedIds = [data.sender, data.receiver].sort().join("_");

      socket.join(sortedIds);

      console.log(`${socket.id} joined room: ${sortedIds}`);
    } catch (err) {
      console.error("Error fetching chat history:", err);
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
