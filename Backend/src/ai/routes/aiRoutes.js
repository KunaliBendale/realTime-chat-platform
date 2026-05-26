import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import {
  enhanceMessage,
  getAiStatus,
  getSmartReplySuggestions,
} from "../controllers/aiController.js";
import { aiRequestRateLimit } from "../middleware/aiRateLimit.middleware.js";
const aiRoutes = express.Router();

aiRoutes.get("/status", protect, getAiStatus);
aiRoutes.get("/smart-replies/:chatId", protect, getSmartReplySuggestions);
aiRoutes.post("/enhance-message", protect, aiRequestRateLimit, enhanceMessage);

export default aiRoutes;
