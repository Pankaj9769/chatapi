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
connect();

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173/", "https://chat-ui-va8r.vercel.app/"],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});
app.use(express.json());
const allowedOrigins = [
  "http://localhost:5173", // Your local frontend URL for development
  "https://chat-ui-va8r.vercel.app/", // Your production frontend URL
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
    credentials: true,
  })
);
app.use("/api/auth", authRouter);
app.use("/api", userRouter);

io.on("connection", (socket) => {
  console.log(`Socket Created`);

  socket.on("offer", ({ offer, roomId }) => {
    socket.broadcast.to(roomId).emit("offer", { offer, roomId }); // Send the offer to all other users in the room
  });

  socket.on("answer", ({ answer, roomId }) => {
    socket.to(roomId).emit("answer", { answer }); // Send the answer to all other users in the room
  });

  socket.on("ice-candidate", ({ candidate, roomId }) => {
    socket.to(roomId).emit("ice-candidate", { candidate }); // Forward ICE candidates to others in the room
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
      // Generate the unique room ID
      console.log(data.sender + " wants to join");
      const sortedIds = [data.sender, data.receiver].sort().join("_");
      console.log(data.sender + " wants to join2");
      io.to(sortedIds).emit("online", data.sender);
      console.log(data.sender + " wants to join3");
      console.log("Reached");
      // Join the specific room
      socket.join(sortedIds);

      // Fetch chat history from the database
      const response = await Message.find({ room: sortedIds }).sort({
        timestamp: 1,
      }); // Sort messages chronologically

      // Emit chat history to the user who joined the room
      console.log("chathistoyyy=> " + response);
      socket.emit("chatHistory", { messages: response });

      console.log(`${socket.id} joined room: ${sortedIds}`);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }

    // Optionally notify others that this user is online
  });

  socket.on("sendMessage", async (data) => {
    try {
      // Generate the unique room ID
      console.log("fata->", data);
      const sortedIds = [data.sender, data.receiver].sort().join("_");

      // Create a message instance
      const msg = new Message({
        room: sortedIds,
        sender: data.sender,
        receiver: data.receiver,
        message: data.message,
      });

      // Save the message to the database
      await msg.save();

      // Emit the message to the specific room
      io.to(sortedIds).emit("receiveMessage", msg); // Emit the saved message
    } catch (err) {
      console.error("Error sending message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Notify other connected clients that a user went offline
    socket.broadcast.emit("offline", { id: socket.id });

    // Optionally, emit an event to the client that disconnected (if relevant)
    socket.emit("clearLocalStorage");
  });
});

server.listen(3000, () => {
  console.log(`Server running on 3000`);
});
