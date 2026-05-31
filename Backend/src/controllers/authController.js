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

const isProduction = process.env.NODE_ENV === "production";
const allowOtpDevFallback = !isProduction && process.env.OTP_DEV_FALLBACK !== "false";
const emailSendTimeoutMs = Number(process.env.EMAIL_SEND_TIMEOUT_MS) || 8000;

const isMailAuthError = (error) =>
  error?.code === "EAUTH" || error?.responseCode === 535;

const sendMailWithTimeout = (mailOptions) => {
  const sendMailPromise = transporter.sendMail(mailOptions);
  sendMailPromise.catch(() => {});

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      const timeoutError = new Error("Email send timed out");
      timeoutError.code = "EMAIL_TIMEOUT";
      reject(timeoutError);
    }, emailSendTimeoutMs);
  });

  return Promise.race([sendMailPromise, timeoutPromise]);
};

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
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = generateOtp();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt, verified: false },
      { upsert: true, returnDocument: "after" }
    );

    try {
      await sendMailWithTimeout({
        from: `"My App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
        html: `<h3>Your OTP is: <b>${otp}</b></h3><p>Expires in 5 minutes.</p>`,
      });
    } catch (mailError) {
      if (allowOtpDevFallback) {
        const reason = isMailAuthError(mailError)
          ? "Gmail credentials were rejected"
          : "Email delivery failed";

        console.warn(
          `${reason}. Development fallback is active. OTP for ${email}: ${otp}`,
        );

        return res.status(200).json({
          success: true,
          message: "OTP sent successfully",
        });
      }

      await Otp.deleteOne({ email });

      const message = isMailAuthError(mailError)
        ? "Email service authentication failed"
        : "Unable to send OTP right now";

      return res.status(503).json({ success: false, message });
    }

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP Error:", err?.message || err);
    res.status(500).json({ success: false, message: "Unable to send OTP right now" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { otp } = req.body;
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

    record.verified = true;
    await record.save();

    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Email, new password and confirm password are required" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirmation password must match" });
    }
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    const verifiedOtp = await Otp.findOne({ email, verified: true });
    if (!verifiedOtp) {
      return res.status(400).json({ success: false, message: "OTP verification required" });
    }

    if (verifiedOtp.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(confirmPassword, 12);

    user.password = hashedPassword;

    await user.save()
    await Otp.deleteOne({ email });

    res.status(200).json({ success: true, message: "password reset successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: "failed to reset Password" });
  }
}

