import AiUsageLog from "../models/AiUsageLog.model.js";

export const logAiUsage = async ({
  userId,
  chatId,
  feature = "smart_reply",
  provider,
  model,
  usage = {},
  latencyMs = 0,
  cached = false,
  success = true,
  errorCode = null,
}) => {
  try {
    await AiUsageLog.create({
      userId,
      chatId,
      feature,
      provider,
      model,
      promptTokens: usage.promptTokens || 0,
      completionTokens: usage.completionTokens || 0,
      totalTokens: usage.totalTokens || 0,
      latencyMs,
      cached,
      success,
      errorCode,
    });
  } catch (error) {
    console.error("[AI] Failed to log token usage:", error.message);
  }
};
