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
      users: userId,
    });

    if (!chat) return null;

    if (chat.isGroup) {
      return {
        chat,
        isGroup: true,
        receiverId: null,
        roomId: chat._id.toString(),
        recipients: chat.users.map((participantId) => participantId.toString()),
      };
    }

    const receiver = chat.users.find(
      (participantId) => participantId.toString() !== userId
    );

    return {
      chat,
      isGroup: false,
      receiverId: receiver?.toString() || receiverId,
      roomId: generateChatRoomId(userId, receiver?.toString() || receiverId),
      recipients: chat.users.map((participantId) => participantId.toString()),
    };
  }

  const chat = await findOrCreateDirectChat(userId, receiverId);

  if (!chat) return null;

  return {
    chat,
    isGroup: false,
    receiverId,
    roomId: generateChatRoomId(userId, receiverId),
    recipients: [userId, receiverId],
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
        const { receiverId, chatId, content, image = null } = data;

        if (!content && !image) {
          return socket.emit("socketError", {
            message: "Message content or image is required",
          });
        }

        const directChat = await getDirectChatForSocket(userId, receiverId, chatId);

        if (!directChat?.chat) {
          return socket.emit("socketError", {
            message: "Chat not found",
          });
        }

        const roomId = directChat.roomId;
        const isReceiverOnline =
          !directChat.isGroup && onlineUsers.has(directChat.receiverId);

        // save message
        const newMessage = await Message.create({
          sender: userId,
          receiver: directChat.isGroup ? undefined : directChat.receiverId,
          message: content,
          chatId: directChat.chat._id,
          image,
          roomId,
          delivered: isReceiverOnline,
          seen: false,
        });

        directChat.chat.latestMessage = newMessage._id;
        await directChat.chat.save();

        const messagePayload = {
          _id: newMessage._id,
          sender: userId,
          receiver: directChat.isGroup ? null : directChat.receiverId,
          message: newMessage.message,
          image: newMessage.image,
          chatId: directChat.chat._id,
          roomId,
          isGroup: directChat.isGroup,
          delivered: newMessage.delivered,
          seen: false,
          createdAt: newMessage.createdAt,
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
        const chatContext = await getDirectChatForSocket(userId, receiverId, chatId);

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
        const chatContext = await getDirectChatForSocket(userId, receiverId, chatId);

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
