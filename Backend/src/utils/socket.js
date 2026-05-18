import { Server } from "socket.io";
import http from "http";
import express from "express";

import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import socketAuthMiddleware from "../middleware/socket.auth.middleware.js";
import { findOrCreateDirectChat } from "../controllers/chatController.js";

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

const getDirectChatForSocket = async (userId, receiverId, chatId) => {
  if (!chatId && !receiverId) return null;

  if (chatId) {
    const chat = await Chat.findOne({
      _id: chatId,
      isGroup: false,
      users: userId,
    });

    if (!chat) return null;

    const receiver = chat.users.find(
      (participantId) => participantId.toString() !== userId
    );

    return {
      chat,
      receiverId: receiver?.toString() || receiverId,
    };
  }

  const chat = await findOrCreateDirectChat(userId, receiverId);

  return {
    chat,
    receiverId,
  };
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

    socket.on("joinChat", async ({ receiverId, chatId }) => {
      try {
        const directChat = await getDirectChatForSocket(userId, receiverId, chatId);

        if (!directChat?.chat || !directChat.receiverId) {
          return socket.emit("socketError", {
            message: "Chat not found",
          });
        }

        const roomId = generateChatRoomId(userId, directChat.receiverId);

        socket.join(roomId);
        socket.join(directChat.chat._id.toString());

        socket.emit("chatJoined", {
          roomId,
          chatId: directChat.chat._id,
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
        const { receiverId, chatId, content,} = data;

        if (!content && !media) {
          return socket.emit("socketError", {
            message: "Message content or media is required",
          });
        }

        const directChat = await getDirectChatForSocket(userId, receiverId, chatId);

        if (!directChat?.chat || !directChat.receiverId) {
          return socket.emit("socketError", {
            message: "Chat not found",
          });
        }

        const roomId = generateChatRoomId(userId, directChat.receiverId);
        const isReceiverOnline = onlineUsers.has(directChat.receiverId);

        // save message
        const newMessage = await Message.create({
          sender: userId,
          receiver: directChat.receiverId,
          message: content,
          chatId: directChat.chat._id,
          image: typeof media === "string" ? media : media?.url,
          roomId,
          delivered: isReceiverOnline,
          seen: false,
        });

        directChat.chat.latestMessage = newMessage._id;
        await directChat.chat.save();

        const messagePayload = {
          _id: newMessage._id,
          sender: userId,
          receiver: directChat.receiverId,
          message: newMessage.message,
          media: newMessage.media,
          image: newMessage.image,
          chatId: directChat.chat._id,
          roomId,
          delivered: newMessage.delivered,
          seen: false,
          createdAt: newMessage.createdAt,
        };

        // send message to room
        io.to(roomId)
          .to(directChat.chat._id.toString())
          .to(directChat.receiverId)
          .to(userId)
          .emit("receiveMessage", messagePayload);

        // update recent chats instantly
        io.to(directChat.receiverId).emit("conversationUpdated", messagePayload);

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
        const message = await Message.findOne({
          _id: messageId,
          receiver: userId,
        });

        if (!message) return;

        message.delivered = true;
        message.deliveredAt = message.deliveredAt || new Date();

        const updatedMessage = await message.save();

        if (!updatedMessage) return;

        // notify sender
        io.to(updatedMessage.sender.toString()).emit(
          "messageDelivered",
          {
            messageId,
            deliveredAt: updatedMessage.deliveredAt,
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
        const updatedMessage = await Message.findOneAndUpdate(
          {
            _id: messageId,
            receiver: userId,
          },
          {
            delivered: true,
            deliveredAt: new Date(),
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

    socket.on("messagesSeen", async ({ chatId, messageIds = [] }) => {
      try {
        if (!chatId && !messageIds.length) return;

        const filter = {
          receiver: userId,
          seen: false,
        };

        if (chatId) {
          filter.chatId = chatId;
        }

        if (messageIds.length) {
          filter._id = {
            $in: messageIds,
          };
        }

        const seenAt = new Date();
        const messages = await Message.find(filter).select("_id sender");

        if (!messages.length) return;

        await Message.updateMany(filter, {
          delivered: true,
          deliveredAt: seenAt,
          seen: true,
          seenAt,
        });

        messages.forEach((message) => {
          io.to(message.sender.toString()).emit("messageSeen", {
            messageId: message._id,
            seen: true,
            seenAt,
          });
        });

      } catch (error) {
        console.log("Messages Seen Error:", error.message);
      }
    });

    /* =========================
       LEGACY MESSAGE STATUS HANDLERS
    ========================= */

    socket.on("legacyMessageDelivered", async ({ messageId }) => {
      try {
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          {
            delivered: true,
            deliveredAt: new Date(),
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
            deliveredAt: updatedMessage.deliveredAt,
          }
        );

      } catch (error) {
        console.log("Message Delivered Error:", error.message);
      }
    });

    socket.on("legacyMessageSeen", async ({ messageId }) => {
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
