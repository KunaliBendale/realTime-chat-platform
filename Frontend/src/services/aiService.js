import { api } from "../lib/api";
import { normalizeSmartReplyResponse } from "../lib/normalizeSmartReplyResponse";
import { socketService } from "./socketService";

const AI_FALLBACK_MESSAGE = "AI is unavailable right now";

const requestAi = async (request) => {
  try {
    return await request();
  } catch (error) {
    const cleanError = new Error(
      error.response?.data?.message || error.message || AI_FALLBACK_MESSAGE,
    );
    cleanError.status = error.response?.status;
    cleanError.code = error.response?.data?.code;
    throw cleanError;
  }
};

export const aiService = {
  async getStatus() {
    const response = await requestAi(() => api.get("/ai/status"));
    return response.data;
  },

  async fetchSmartReplies(chatId, { forceRefresh = false } = {}) {
    let payload = null;

    if (socketService.isConnected()) {
      try {
        payload = await socketService.requestSmartReplies({ chatId, forceRefresh });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug("[AI] socket smart replies failed, trying REST", error.message);
        }

        if (error.fallbackToRest === false) {
          throw error;
        }
      }
    }

    if (!payload) {
      const response = await requestAi(() =>
        api.get(`/ai/smart-replies/${chatId}`, {
          params: forceRefresh ? { refresh: "true" } : undefined,
          timeout: 15000,
        }),
      );
      payload = response.data;
    }

    return normalizeSmartReplyResponse(payload);
  },

  async enhanceMessage({ message, tone }) {
    const response = await requestAi(() =>
      api.post("/ai/enhance-message", { message, tone }, { timeout: 18000 }),
    );

    return response.data;
  },
};
