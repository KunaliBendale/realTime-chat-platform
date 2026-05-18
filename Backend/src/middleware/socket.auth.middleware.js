import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const socketAuthMiddleware = async (socket, next) => {
  try {

    // token from frontend
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.authorization;

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    // remove Bearer if exists
    const cleanToken = token.startsWith("Bearer ")
      ? token.split(" ")[1]
      : token;

    // verify token
    const decoded = jwt.verify(
      cleanToken,
      process.env.JWT_SECRET
    );

    // get user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {    
      return next(new Error("Authentication error: User not found"));
    }

    // attach user to socket
    socket.user = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
    };

    next();

  } catch (error) {
    console.log("Socket auth error:", error.message);

    next(new Error("Authentication error"));
  }
};

export default socketAuthMiddleware;