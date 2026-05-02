import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, mobile, } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: "User already exists with this email address." });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Password and Confirm Password must match" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            mobile
        })

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
            return res.status(400).json({ message: "User not found" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = generateToken(user._id);
        res.status(200).json({ message: "User Logged In Successfully", token, data: user });
    } catch (error) {
        res.status(500).json({ message: "Error logging in user" });
    }
}