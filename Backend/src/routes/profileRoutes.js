import express from "express";
import {
  getMyProfile,
  getUserProfile,
  updateMyProfile,
  updateProfileImage,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multerMiddleware.js";

const profileRoutes = express.Router();

const uploadProfileImage = (req, res, next) => {
  upload.single("profilePic")(req, res, (error) => {
    if (!error) {
      return next();
    }

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Image size must be under 5MB"
        : "Please select a valid image";

    return res.status(400).json({ success: false, message });
  });
};

profileRoutes.get("/me", protect, getMyProfile);
profileRoutes.put("/me", protect, updateMyProfile);
profileRoutes.patch("/me/photo", protect, uploadProfileImage, updateProfileImage);
profileRoutes.get("/users/:userId", protect, getUserProfile);

export default profileRoutes;
