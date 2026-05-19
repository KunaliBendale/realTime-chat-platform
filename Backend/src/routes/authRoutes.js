import { registerUser,loginUser,sendOtp,verifyOtp,resetPassword,getMe } from "../controllers/authController.js";
import { loginWithGoogle,googleCallback } from "../controllers/googleAuthController.js";
import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const authRoutes = express.Router();

authRoutes.post("/register",registerUser);
authRoutes.post("/login",loginUser);
authRoutes.get("/me", protect, getMe);

authRoutes.get("/google", loginWithGoogle);
authRoutes.get("/google/callback", googleCallback);

authRoutes.post("/send-otp", sendOtp);
authRoutes.post("/verify-otp", verifyOtp);
authRoutes.post("/reset-password", resetPassword);

export default authRoutes;
