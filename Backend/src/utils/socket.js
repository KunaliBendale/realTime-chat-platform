import { Server } from "socket.io";
import http from "http";
import express from "express";

import Message from "../models/messageModel.js";
import socketAuthMiddleware from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

/* =========================
   SOCKET IO CONFIG
========================= */

const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
   transports: ["websocket", "polling"],
});

/* =========================
   SOCKET AUTH MIDDLEWARE
========================= */

io.use(socketAuthMiddleware);

/* =========================
   ONLINE USERS MAP
========================= */

// Map<userId, socketId>
const onlineUsers = new Map();

/* =========================
   GET SOCKET ID
========================= */

export const getReceiverSocketId = (userId) => {
  return onlineUsers.get(userId);
};

/* =========================
   ROOM GENERATOR
========================= */

const generateChatRoomId = (user1, user2) => {
  return [user1, user2].sort().join("_");
};

/* =========================
   SOCKET CONNECTION
========================= */

io.on("connection", (socket) => {
  try {
    const user = socket.user;
    const userId = user.userId;

    console.log("User Connected:", userId);

    /* =========================
       STORE ONLINE USER
    ========================= */

    onlineUsers.set(userId, socket.id);

    // personal room
    socket.join(userId);

    // send all online users
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    // user online event
    io.emit("userStatus", {
      userId,
      status: "online",
    });

    /* =========================
       JOIN PRIVATE CHAT
    ========================= */

    socket.on("joinChat", ({ receiverId }) => {
      try {
        const roomId = generateChatRoomId(userId, receiverId);

        socket.join(roomId);

        socket.emit("chatJoined", {
          roomId,
        });

        console.log(`${userId} joined room ${roomId}`);
      } catch (error) {
        console.log("Join Chat Error:", error.message);
      }
    });

    /* =========================
       SEND MESSAGE
    ========================= */

    socket.on("sendMessage", async (data) => {
      try {
        const { receiverId, content, media = null } = data;

        const roomId = generateChatRoomId(userId, receiverId);

        // save message
        const newMessage = await Message.create({
          sender: userId,
          receiver: receiverId,
          message: content,
          media,
          roomId,
          delivered: true,
          seen: false,
        });

        const messagePayload = {
          _id: newMessage._id,
          sender: userId,
          receiver: receiverId,
          message: newMessage.message,
          media: newMessage.media,
          roomId,
          delivered: true,
          seen: false,
          createdAt: newMessage.createdAt,
        };

        // send message to room
        io.to(roomId).emit("receiveMessage", messagePayload);

        // update recent chats instantly
        io.to(receiverId).emit("conversationUpdated", messagePayload);

        io.to(userId).emit("conversationUpdated", messagePayload);

      } catch (error) {
        console.log("Send Message Error:", error.message);

        socket.emit("socketError", {
          message: "Failed to send message",
        });
      }
    });

    /* =========================
       TYPING INDICATOR
    ========================= */

    socket.on("typing", ({ receiverId }) => {
      try {
        const roomId = generateChatRoomId(userId, receiverId);

        socket.to(roomId).emit("typing", {
          senderId: userId,
        });
      } catch (error) {
        console.log("Typing Error:", error.message);
      }
    });

    socket.on("stopTyping", ({ receiverId }) => {
      try {
        const roomId = generateChatRoomId(userId, receiverId);

        socket.to(roomId).emit("stopTyping", {
          senderId: userId,
        });
      } catch (error) {
        console.log("Stop Typing Error:", error.message);
      }
    });

    /* =========================
       MESSAGE DELIVERED
    ========================= */

    socket.on("messageDelivered", async ({ messageId }) => {
      try {
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          {
            delivered: true,
          },
          {
            new: true,
          }
        );

        if (!updatedMessage) return;

        // notify sender
        io.to(updatedMessage.sender.toString()).emit(
          "messageDelivered",
          {
            messageId,
          }
        );

      } catch (error) {
        console.log("Message Delivered Error:", error.message);
      }
    });

    /* =========================
       MESSAGE SEEN
    ========================= */

    socket.on("messageSeen", async ({ messageId }) => {
      try {
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          {
            seen: true,
            seenAt: new Date(),
          },
          {
            new: true,
          }
        );

        if (!updatedMessage) return;

        // notify sender
        io.to(updatedMessage.sender.toString()).emit(
          "messageSeen",
          {
            messageId,
            seen: true,
            seenAt: updatedMessage.seenAt,
          }
        );

      } catch (error) {
        console.log("Message Seen Error:", error.message);
      }
    });

    /* =========================
       CHECK USER ONLINE
    ========================= */

    socket.on("checkUserOnline", ({ targetUserId }, callback) => {
      callback({
        online: onlineUsers.has(targetUserId),
      });
    });

    /* =========================
       DISCONNECT
    ========================= */

    socket.on("disconnect", () => {
      console.log("User Disconnected:", userId);

      onlineUsers.delete(userId);

      // updated online users
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));

      // offline status
      io.emit("userStatus", {
        userId,
        status: "offline",
        lastSeen: new Date(),
      });
    });

  } catch (error) {
    console.log("Socket Connection Error:", error.message);
  }
});

export { io, app, server };