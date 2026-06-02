import mongoose from "mongoose";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import { uploadChatImage } from "../utils/chatImageUpload.js";

const chatPopulateOptions = [
  {
    path: "users",
    select: "-password",
  },
  {
    path: "groupAdmin",
    select: "name email profilePic",
  },
  {
    path: "latestMessage",
    populate: {
      path: "sender receiver",
      select: "name email profilePic",
    },
  },
];

const parseUserIds = (users = []) => {
  if (typeof users === "string") {
    try {
      users = JSON.parse(users);
    } catch {
      users = users.split(",");
    }
  }

  if (!Array.isArray(users)) return [];

  return users
    .map((userId) => userId?.toString().trim())
    .filter(Boolean);
};

const getUniqueValidUserIds = (users = []) => {
  return [...new Set(users)].filter((userId) =>
    mongoose.Types.ObjectId.isValid(userId)
  );
};

const populateChat = (chatId) => {
  return Chat.findById(chatId).populate(chatPopulateOptions);
};

const isGroupAdmin = (chat, userId) => {
  return chat.groupAdmin?.toString() === userId.toString();
};

export const getRoomIdForChat = (chat, senderId, receiverId) => {
  if (chat.isGroup) return chat._id.toString();

  return [senderId.toString(), receiverId.toString()].sort().join("_");
};

export const resolveChatForMessage = async ({ chatId, senderId, receiverId }) => {
  if (chatId) {
    if (!mongoose.Types.ObjectId.isValid(chatId)) return null;

    const chat = await Chat.findOne({
      _id: chatId,
      users: senderId,
    });

    if (!chat) return null;

    if (chat.isGroup) {
      return {
        chat,
        receiverId: null,
        roomId: chat._id.toString(),
      };
    }

    const receiver = chat.users.find(
      (participantId) => participantId.toString() !== senderId.toString()
    );

    return {
      chat,
      receiverId: receiver?.toString() || receiverId,
      roomId: getRoomIdForChat(chat, senderId, receiver?.toString() || receiverId),
    };
  }

  const chat = await findOrCreateDirectChat(senderId, receiverId);

  if (!chat) return null;

  return {
    chat,
    receiverId,
    roomId: getRoomIdForChat(chat, senderId, receiverId),
  };
};

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

export const getUsersForChat = async (req, res) => {
  try {
    const search = req.query.search || req.query.q || "";
    const query = {
      _id: {
        $ne: req.user._id,
      },
    };

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { mobile: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name email mobile profilePic status")
      .limit(20)
      .sort({ name: 1 });

    res.status(200).json(users);
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

export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { receiverId, content, message, image = null, clientTempId = null } = req.body;
    const messageText = content ?? message ?? "";

    if (!messageText.trim() && !image) {
      return res.status(400).json({ message: "Message content or image is required" });
    }

    const chatContext = await resolveChatForMessage({
      chatId,
      senderId: req.user._id,
      receiverId,
    });

    if (!chatContext?.chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    let uploadedImageUrl = null;

    if (image) {
      try {
        uploadedImageUrl = await uploadChatImage(image);
      } catch (uploadError) {
        return res.status(400).json({
          message: "Failed to upload image. Please try again.",
        });
      }
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: chatContext.chat.isGroup ? undefined : chatContext.receiverId,
      message: messageText.trim(),
      image: uploadedImageUrl,
      chatId: chatContext.chat._id,
      roomId: chatContext.roomId,
      delivered: false,
      seen: false,
    });

    chatContext.chat.latestMessage = newMessage._id;
    await chatContext.chat.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "name email profilePic")
      .populate("receiver", "name email profilePic");

    res.status(201).json({
      ...populatedMessage.toObject(),
      clientTempId,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const createGroupChat = async (req, res) => {
  try {
    const chatName = req.body.chatName || req.body.name;
    const requestedUsers = parseUserIds(req.body.users);
    const users = getUniqueValidUserIds([
      ...requestedUsers,
      req.user._id.toString(),
    ]);

    if (!chatName?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (users.length < 2) {
      return res.status(400).json({
        message: "A group chat needs at least one other user",
      });
    }

    const existingUsersCount = await User.countDocuments({
      _id: {
        $in: users,
      },
    });

    if (existingUsersCount !== users.length) {
      return res.status(400).json({ message: "One or more users are invalid" });
    }

    const groupChat = await Chat.create({
      chatName: chatName.trim(),
      isGroup: true,
      users,
      groupAdmin: req.user._id,
    });

    res.status(201).json(await populateChat(groupChat._id));
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateGroupChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chatName = req.body.chatName || req.body.name;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chatId" });
    }

    if (!chatName?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      isGroup: true,
    });

    if (!chat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    if (!isGroupAdmin(chat, req.user._id)) {
      return res.status(403).json({ message: "Only group admin can edit group" });
    }

    chat.chatName = chatName.trim();
    await chat.save();

    res.status(200).json(await populateChat(chat._id));
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const addUsersToGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const newUsers = getUniqueValidUserIds(parseUserIds(req.body.users));

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chatId" });
    }

    if (!newUsers.length) {
      return res.status(400).json({ message: "users are required" });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      isGroup: true,
    });

    if (!chat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    if (!isGroupAdmin(chat, req.user._id)) {
      return res.status(403).json({ message: "Only group admin can add users" });
    }

    const existingUsersCount = await User.countDocuments({
      _id: {
        $in: newUsers,
      },
    });

    if (existingUsersCount !== newUsers.length) {
      return res.status(400).json({ message: "One or more users are invalid" });
    }

    newUsers.forEach((userId) => {
      const alreadyInGroup = chat.users.some(
        (existingUserId) => existingUserId.toString() === userId
      );

      if (!alreadyInGroup) {
        chat.users.push(userId);
      }
    });

    await chat.save();

    res.status(200).json(await populateChat(chat._id));
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const removeUsersFromGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const usersToRemove = getUniqueValidUserIds(parseUserIds(req.body.users));

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chatId" });
    }

    if (!usersToRemove.length) {
      return res.status(400).json({ message: "users are required" });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      isGroup: true,
    });

    if (!chat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    const isRemovingSelf =
      usersToRemove.length === 1 &&
      usersToRemove[0] === req.user._id.toString();

    if (!isRemovingSelf && !isGroupAdmin(chat, req.user._id)) {
      return res.status(403).json({
        message: "Only group admin can remove other users",
      });
    }

    if (usersToRemove.includes(chat.groupAdmin?.toString())) {
      return res.status(400).json({
        message: "Group admin cannot be removed",
      });
    }

    chat.users = chat.users.filter(
      (userId) => !usersToRemove.includes(userId.toString())
    );

    if (chat.users.length < 2) {
      return res.status(400).json({
        message: "Group must keep at least two users",
      });
    }

    await chat.save();

    res.status(200).json(await populateChat(chat._id));
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteGroupChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chatId" });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      isGroup: true,
    });

    if (!chat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    if (!isGroupAdmin(chat, req.user._id)) {
      return res.status(403).json({ message: "Only group admin can delete group" });
    }

    await Message.deleteMany({ chatId: chat._id });
    await Chat.deleteOne({ _id: chat._id });

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
      chatId,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
