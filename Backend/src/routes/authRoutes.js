import { registerUser,loginUser } from "../controllers/authController.js";
import express from "express";

const authRoutes = express.Router();

authRoutes.post("/register",registerUser);
authRoutes.post("/login",loginUser);

export default authRoutes;