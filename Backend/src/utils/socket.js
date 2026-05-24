import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";

import Message from "../models/messageModel.js";
import { registerSmartReplySocketHandlers } from "../ai/socket/smartReply.socket.js";
import socketAuthMiddleware from "../middleware/socket.auth.middleware.js";
import { resolveChatForMessage } from "../controllers/chatController.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedSocketOrigins = process.env.CLIENT_URL
  ? [
      ...process.env.CLIENT_URL.split(",").map((origin) => origin.trim()),
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ]
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

/* =========================
   SOCKET IO CONFIG
========================= */

const io = new Server(server, {
  cors: {
    origin: allowedSocketOrigins,
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

// Map<userId, Set<socketId>>
const onlineUsers = new Map();

/* =========================
   GET SOCKET ID
========================= */

export const getReceiverSocketId = (userId) => {
  return Array.from(onlineUsers.get(userId) || []);
};

/* =========================
   ROOM GENERATOR
========================= */

const generateChatRoomId = (user1, user2) => {
  return [user1, user2].sort().join("_");
};

const getChatForSocket = async (userId, receiverId, chatId) => {
  const chatContext = await resolveChatForMessage({
    chatId,
    senderId: userId,
    receiverId,
  });

  if (!chatContext?.chat) return null;

  return {
    ...chatContext,
    isGroup: chatContext.chat.isGroup,
    recipients: chatContext.chat.users.map((participantId) => participantId.toString()),
  };
};

const addOnlineSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  onlineUsers.get(userId).add(socketId);
};

const removeOnlineSocket = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);

  if (!sockets) return false;

  sockets.delete(socketId);

  if (sockets.size) return true;

  onlineUsers.delete(userId);
  return false;
};

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

/* =========================
   SOCKET CONNECTION
========================= */

io.on("connection", (socket) => {
  try {
    const user = socket.user;
    const userId = user.userId;

    /* =========================
       STORE ONLINE USER
    ========================= */

    addOnlineSocket(userId, socket.id);

    registerSmartReplySocketHandlers(io, socket);

    // personal room
    socket.join(userId);

    // send all online users
    io.emit("onlineUsers", getOnlineUserIds());

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
        const directChat = await getChatForSocket(userId, receiverId, chatId);

        if (!directChat?.chat) {
          return socket.emit("socketError", {
            message: "Chat not found",
          });
        }

        const roomId = directChat.roomId;

        socket.join(roomId);
        socket.join(directChat.chat._id.toString());

        socket.emit("chatJoined", {
          roomId,
          chatId: directChat.chat._id,
          isGroup: directChat.isGroup,
        });

        
      } catch (error) {
        console.log("Join Chat Error:", error.message);
      }
    });

    /* =========================
       SEND MESSAGE
    ========================= */

    socket.on("sendMessage", async (data) => {
      try {
        const { receiverId, chatId, content, image = null, clientTempId = null } = data;

        if (!content && !image) {
          return socket.emit("socketError", {
            message: "Message content or image is required",
          });
        }

        const directChat = await getChatForSocket(userId, receiverId, chatId);

        if (!directChat?.chat) {
          return socket.emit("socketError", {
            message: "Chat not found",
          });
        }

        const roomId = directChat.roomId;
        const isReceiverOnline =
          !directChat.isGroup && onlineUsers.has(directChat.receiverId);

        // save message
        const createdMessage = await Message.create({
          sender: userId,
          receiver: directChat.isGroup ? undefined : directChat.receiverId,
          message: content,
          chatId: directChat.chat._id,
          image,
          roomId,
          delivered: isReceiverOnline,
          deliveredAt: isReceiverOnline ? new Date() : undefined,
          seen: false,
        });

        directChat.chat.latestMessage = createdMessage._id;
        await directChat.chat.save();

        const newMessage = await Message.findById(createdMessage._id)
          .populate("sender", "name email profilePic")
          .populate("receiver", "name email profilePic");

        const messagePayload = {
          _id: newMessage._id,
          sender: newMessage.sender,
          receiver: newMessage.receiver || null,
          message: newMessage.message,
          image: newMessage.image,
          chatId: directChat.chat._id,
          roomId,
          isGroup: directChat.isGroup,
          delivered: newMessage.delivered,
          deliveredAt: newMessage.deliveredAt,
          seen: false,
          createdAt: newMessage.createdAt,
          clientTempId,
        };

        // send message to room
        let messageEmitter = io.to(roomId).to(directChat.chat._id.toString());
        directChat.recipients.forEach((recipientId) => {
          messageEmitter = messageEmitter.to(recipientId);
        });
        messageEmitter.emit("receiveMessage", messagePayload);

        // update recent chats instantly
        directChat.recipients.forEach((recipientId) => {
          io.to(recipientId).emit("conversationUpdated", messagePayload);
        });

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

    socket.on("typing", async ({ receiverId, chatId }) => {
      try {
        const chatContext = await getChatForSocket(userId, receiverId, chatId);

        if (!chatContext?.chat) return;

        const roomId = chatContext.roomId;

        socket.to(roomId).emit("typing", {
          senderId: userId,
          chatId: chatContext.chat._id,
          isGroup: chatContext.isGroup,
        });
      } catch (error) {
        console.log("Typing Error:", error.message);
      }
    });

    socket.on("stopTyping", async ({ receiverId, chatId }) => {
      try {
        const chatContext = await getChatForSocket(userId, receiverId, chatId);

        if (!chatContext?.chat) return;

        const roomId = chatContext.roomId;

        socket.to(roomId).emit("stopTyping", {
          senderId: userId,
          chatId: chatContext.chat._id,
          isGroup: chatContext.isGroup,
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

      const stillOnline = removeOnlineSocket(userId, socket.id);

      // updated online users
      io.emit("onlineUsers", getOnlineUserIds());

      if (stillOnline) return;

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
