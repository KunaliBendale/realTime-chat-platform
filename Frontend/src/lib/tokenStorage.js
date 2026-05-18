const TOKEN_KEY = "chat_auth_token";
const USER_KEY = "chat_auth_user";

export const tokenStorage = {
  getToken() {
    return window.localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    window.localStorage.removeItem(TOKEN_KEY);
  },

  getUser() {
    const storedUser = window.localStorage.getItem(USER_KEY);

    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {
      window.localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setUser(user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearUser() {
    window.localStorage.removeItem(USER_KEY);
  },

  clearAuth() {
    this.clearToken();
    this.clearUser();
  },
};
