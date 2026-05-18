import { accessChat, getChatMessages, getMyChats } from "../controllers/chatController.js";
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
const chatRoutes = express.Router();

chatRoutes.get("/mychats", protect, getMyChats);
chatRoutes.post("/accessChat", protect, accessChat);
chatRoutes.get("/:chatId/messages", protect, getChatMessages);

export default chatRoutes;
