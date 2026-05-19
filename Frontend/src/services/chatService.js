import { api } from "../lib/api";

const normalizeUsersPayload = (users) => {
  if (Array.isArray(users)) return users;

  if (typeof users === "string") {
    return users
      .split(",")
      .map((userId) => userId.trim())
      .filter(Boolean);
  }

  return [];
};

export const chatService = {
  async fetchChats() {
    const response = await api.get("/chat/mychats");
    return response.data;
  },

  async searchUsers(search = "") {
    const response = await api.get("/chat/users", {
      params: {
        search,
      },
    });
    return response.data;
  },

  async accessChat(userId) {
    const response = await api.post("/chat/accessChat", { userId });
    return response.data;
  },

  async fetchMessages(chatId, params = {}) {
    const response = await api.get(`/chat/${chatId}/messages`, {
      params: {
        limit: params.limit || 30,
        before: params.before || undefined,
      },
    });

    return response.data;
  },

  async sendMessage(chatId, payload) {
    const response = await api.post(`/chat/${chatId}/messages`, payload);
    return response.data;
  },

  async createGroup({ chatName, users }) {
    const response = await api.post("/chat/group", {
      chatName,
      users: normalizeUsersPayload(users),
    });

    return response.data;
  },

  async updateGroup(chatId, { chatName }) {
    const response = await api.put(`/chat/group/${chatId}`, {
      chatName,
    });

    return response.data;
  },

  async addUsersToGroup(chatId, users) {
    const response = await api.put(`/chat/group/${chatId}/users/add`, {
      users: normalizeUsersPayload(users),
    });

    return response.data;
  },

  async removeUsersFromGroup(chatId, users) {
    const response = await api.put(`/chat/group/${chatId}/users/remove`, {
      users: normalizeUsersPayload(users),
    });

    return response.data;
  },

  async deleteGroup(chatId) {
    const response = await api.delete(`/chat/group/${chatId}`);
    return response.data;
  },
};
