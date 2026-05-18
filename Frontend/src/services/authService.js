import { api } from "../lib/api";

const sanitizeUser = (user) => {
  if (!user) return null;

  const safeUser = { ...user };
  delete safeUser.password;

  return safeUser;
};

export const authService = {
  async login(credentials) {
    const response = await api.post("/auth/login", credentials);
    const { token, data, user, message } = response.data;

    return {
      token,
      user: sanitizeUser(data || user),
      message,
    };
  },

  async register(payload) {
    const response = await api.post("/auth/register", payload);

    return {
      message:
        typeof response.data === "string"
          ? response.data
          : response.data?.message || "Registration successful",
    };
  },
};
