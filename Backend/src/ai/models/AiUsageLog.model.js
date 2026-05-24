import mongoose from "mongoose";

const aiUsageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      index: true,
    },
    feature: {
      type: String,
      required: true,
      enum: ["smart_reply"],
      default: "smart_reply",
    },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    cached: { type: Boolean, default: false },
    success: { type: Boolean, default: true },
    errorCode: { type: String },
  },
  { timestamps: true },
);

aiUsageLogSchema.index({ createdAt: -1 });
aiUsageLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.AiUsageLog ||
  mongoose.model("AiUsageLog", aiUsageLogSchema);
