import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { getAiStatus, getSmartReplySuggestions } from "../controllers/aiController.js";
const aiRoutes = express.Router();

aiRoutes.get("/status", protect, getAiStatus);
aiRoutes.get("/smart-replies/:chatId", protect, getSmartReplySuggestions);

export default aiRoutes;
