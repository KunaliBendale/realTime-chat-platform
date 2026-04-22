import User from "../models/userModel.js";
import mongoose from "mongoose";

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const newUser = await User.create(req.body);
        res.status(200).json("User Created Successfully");
    } catch (error) {
        res.status(500).json({ message: "Error creating user" });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        res.status(200).json("User Logged In Successfully");
    } catch (error) {
        res.status(500).json({ message: "Error logging in user" });
    }
}