import mongoose from "mongoose";
const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    roomId: {
      type: String,
      trim: true,
      index: true,
    },

    image: {
      type: String,
    },
    delivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
    },
    
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });


const Message = mongoose.model("Message", messageSchema);
export default Message;
