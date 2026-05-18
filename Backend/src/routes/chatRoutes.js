import { accessChat } from "../controllers/chatController.js";
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
const chatRoutes = express.Router();

chatRoutes.post("/accessChat", protect, accessChat);

export default chatRoutes;