import fs from "fs/promises";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import { uploadOnCloudinary } from "../middleware/cloudinaryMiddleware.js";

const userSelect = "name email mobile profilePic status providers createdAt updatedAt";


const serializeUser = (user) => {
  if (!user) return null;

  const source = user.toObject ? user.toObject() : user;

  return {
    _id: source._id,
    id: source._id?.toString?.() || source.id,
    name: source.name,
    email: source.email,
    mobile: source.mobile,
    profilePic: source.profilePic,
    status: source.status,
    providers: source.providers || [],
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};

const sendProfile = (res, user, message) => {
  res.status(200).json({
    success: true,
    message,
    data: serializeUser(user),
  });
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(userSelect);

    if (!user) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    return sendProfile(res, user, "Profile fetched successfully");
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch profile" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user" });
    }

    const user = await User.findById(userId).select(userSelect);

    if (!user) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    return sendProfile(res, user, "Profile fetched successfully");
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch profile" });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const updates = {};
    const { name, mobile, status } = req.body;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      updates.name = trimmedName;
    }

    if (mobile !== undefined) {
      const trimmedMobile = String(mobile).trim();
      if (!/^\d{10}$/.test(trimmedMobile)) {
        return res
          .status(400)
          .json({ success: false, message: "Mobile number must be 10 digits" });
      }

      const existingUser = await User.findOne({
        mobile: trimmedMobile,
        _id: { $ne: req.user._id },
      });

      if (existingUser) {
        return res
          .status(409)
          .json({ success: false, message: "Mobile number is already in use" });
      }

      updates.mobile = trimmedMobile;
    }

    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }
      updates.status = status;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select(userSelect);

    return sendProfile(res, user, "Profile updated successfully");
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update profile" });
  }
};

export const updateProfileImage = async (req, res) => {
  let localPath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please select a valid image" });
    }

    const normalizedLocalPath = localPath.replace(/\\/g, "/");
    let profilePic = `${req.protocol}://${req.get("host")}/${normalizedLocalPath}`;

    try {
      const uploadedImage = await uploadOnCloudinary(localPath);

      if (uploadedImage?.secure_url) {
        profilePic = uploadedImage.secure_url;
        localPath = null;
      }
    } catch (error) {
      profilePic = `${req.protocol}://${req.get("host")}/${normalizedLocalPath}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic },
      { returnDocument: 'after', runValidators: true },
    ).select(userSelect);

    return sendProfile(res, user, "Profile image updated successfully");
  } catch (error) {
    if (localPath) {
      await fs.unlink(localPath).catch(() => { });
    }

    return res
      .status(500)
      .json({ success: false, message: "Unable to update profile image" });
  }
};
