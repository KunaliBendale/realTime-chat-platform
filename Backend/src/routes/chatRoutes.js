import {
  accessChat,
  addUsersToGroup,
  createGroupChat,
  deleteGroupChat,
  getChatMessages,
  getMyChats,
  getUsersForChat,
  removeUsersFromGroup,
  sendMessage,
  updateGroupChat,
} from "../controllers/chatController.js";
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
const chatRoutes = express.Router();

chatRoutes.get("/", protect, getMyChats);
chatRoutes.get("/mychats", protect, getMyChats);
chatRoutes.get("/users", protect, getUsersForChat);
chatRoutes.post("/accessChat", protect, accessChat);

chatRoutes.post("/group", protect, createGroupChat);
chatRoutes.put("/group/:chatId", protect, updateGroupChat);
chatRoutes.delete("/group/:chatId", protect, deleteGroupChat);
chatRoutes.put("/group/:chatId/users/add", protect, addUsersToGroup);
chatRoutes.put("/group/:chatId/users/remove", protect, removeUsersFromGroup);

chatRoutes.get("/:chatId/messages", protect, getChatMessages);
chatRoutes.post("/:chatId/messages", protect, sendMessage);

export default chatRoutes;
