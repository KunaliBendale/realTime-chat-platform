import User from "../models/userModel.js";

export const addUser = async (req, res) => {
    try {
        const user = await User.create(req.body)
        res.status(200).json({ success: true, message: "User added successfully" })
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add user" });
    }

} 

export const deleteUser=async(req,res)=>{
    try {
        const deletedUser=await User.delete(req.body)
        res.status(200).json({ success: true, message: "User deleetd successfully" })
    } catch (error) {
         res.status(500).json({ success: false, message: "Failed to delete user" });
    }
}

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "user not found" });
    }

    Object.assign(user, req.body); // update only provided fields
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

export const updateUserProfileImage = async (req, res) => {
  try {

    const { id } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "user not found" });
    }

    const profilePic = req.file.buffer;

    console.log("cloudinary", "id", id);
    console.log("profile", req.file.buffer);

    const cloudinaryRes = await uploadOnCloudinary(profilePic);

    if (!cloudinaryRes) {
      return res.status(500).json({ message: "Image upload failed" });
    }

    // update user profilePic in DB
    const updatedClient = await User.findByIdAndUpdate(
      id,
      { profilePic: cloudinaryRes.secure_url },
      { new: true }
    );

    res.status(200).json({
      message: "Profile image updated successfully",
      client: updatedClient,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export const getUserProfileById = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "Advisor not found" });
    }
    res.status(200).json({ success: true, data: advisor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch advisor profile" });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, confirmPassword } = req.body;

    if (!userId || !currentPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ message: "All fields are required" });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "user not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
