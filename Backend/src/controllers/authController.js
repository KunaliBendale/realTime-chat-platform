import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";
import Otp from "../models/OTPModel.js";
import { generateOtp } from "../utils/generateOtp.js";
import transporter from "../middleware/nodeMailer.js";

const buildAuthResponse = (user, token) => ({
  message: "Authentication successful",
  token,
  data: {
    _id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    profilePic: user.profilePic,
    status: user.status,
    providers: user.providers,
  },
});

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, mobile } = req.body;
        if (!name || !email || !password || !confirmPassword || !mobile) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const user = await User.findOne({
            $or: [{ email: email.trim().toLowerCase() }, { mobile: mobile.trim() }],
        }).select("+password");

        if (user) {
            return res.status(400).json({ message: "User already exists with this email or mobile." });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Password and Confirm Password must match" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            mobile: mobile.trim()
        });

        const token = generateToken(newUser._id);
        res.status(201).json({
          ...buildAuthResponse(newUser, token),
          message: "User Created Successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message || "Error creating user" });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = generateToken(user._id);
        res.status(200).json({
          ...buildAuthResponse(user, token),
          message: "User Logged In Successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Error logging in user" });
    }
}

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = generateOtp();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: `"My App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
      html: `<h3>Your OTP is: <b>${otp}</b></h3><p>Expires in 5 minutes.</p>`,
    });

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const record = await Otp.findOne({ email });

    if (!record) return res.status(400).json({ message: "No OTP found" });

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await Otp.deleteOne({ email });

    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword, email } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Email, new password and confirm password are required" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirmation password must match" });
    }
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(confirmPassword, 12);

    user.password = hashedPassword;

    await user.save()

    res.status(200).json({ success: true, message: "password reset successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: "failed to reset Password" });
  }
}

