import mongoose from 'mongoose';

const chatSchema = mongoose.Schema(
  {
    chatName: {
      type: String,
      default: 'personal',
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ isGroup: 1, users: 1 });
chatSchema.index({ latestMessage: 1 });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
