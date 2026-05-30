import { api } from "../lib/api";
import { normalizeSmartReplyResponse } from "../lib/normalizeSmartReplyResponse";
import { socketService } from "./socketService";

export const aiService = {
  async getStatus() {
    const response = await api.get("/ai/status");
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
      const response = await api.get(`/ai/smart-replies/${chatId}`, {
        params: forceRefresh ? { refresh: "true" } : undefined,
        timeout: 15000,
      });
      payload = response.data;
    }

    return normalizeSmartReplyResponse(payload);
  },

  async enhanceMessage({ message, tone }) {
    const response = await api.post(
      "/ai/enhance-message",
      { message, tone },
      { timeout: 18000 },
    );

    return response.data;
  },
};
