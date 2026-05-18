import mongoose from "mongoose";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";

const chatPopulateOptions = [
  {
    path: "users",
    select: "-password",
  },
  {
    path: "latestMessage",
    populate: {
      path: "sender receiver",
      select: "name email profilePic",
    },
  },
];

export const findOrCreateDirectChat = async (currentUserId, otherUserId) => {
  if (
    !otherUserId ||
    !mongoose.Types.ObjectId.isValid(otherUserId) ||
    currentUserId.toString() === otherUserId.toString()
  ) {
    return null;
  }

  const userExists = await User.exists({ _id: otherUserId });

  if (!userExists) return null;

  let chat = await Chat.findOne({
    isGroup: false,
    users: {
      $all: [currentUserId, otherUserId],
      $size: 2,
    },
  }).populate(chatPopulateOptions);

  if (chat) return chat;

  chat = await Chat.create({
    chatName: "personal",
    isGroup: false,
    users: [currentUserId, otherUserId],
  });

  return Chat.findById(chat._id).populate(chatPopulateOptions);
};

export const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: "Cannot create chat with yourself" });
    }

    const chat = await findOrCreateDirectChat(req.user._id, userId);

    if (!chat) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(chat);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .populate(chatPopulateOptions);

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chatId" });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      users: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const query = { chatId };

    if (req.query.before) {
      query.createdAt = {
        $lt: new Date(req.query.before),
      };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "name email profilePic")
      .populate("receiver", "name email profilePic");
    const nextCursor = messages.length ? messages[messages.length - 1].createdAt : null;

    res.status(200).json({
      messages: messages.reverse(),
      nextCursor,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
