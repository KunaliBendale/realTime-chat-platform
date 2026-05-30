import { create } from "zustand";
import { authService } from "../services/authService";
import { profileService } from "../services/profileService";
import { socketService } from "../services/socketService";
import { tokenStorage } from "../lib/tokenStorage";

const getInitialAuthState = () => {
  const token = tokenStorage.getToken();
  const user = tokenStorage.getUser();

  if (token && user) {
    return {
      token,
      user,
      isAuthenticated: true,
      status: "authenticated",
    };
  }

  tokenStorage.clearAuth();

  return {
    token: null,
    user: null,
    isAuthenticated: false,
    status: "unauthenticated",
  };
};

export const useAuthStore = create((set) => ({
  ...getInitialAuthState(),
  error: null,
  successMessage: null,

  login: async (credentials) => {
    set({ status: "loading", error: null, successMessage: null });

    try {
      const { token, user, message } = await authService.login(credentials);

      if (!token || !user) {
        throw new Error("Login response is missing authentication data");
      }

      tokenStorage.setToken(token);
      tokenStorage.setUser(user);

      set({
        token,
        user,
        isAuthenticated: true,
        status: "authenticated",
        error: null,
        successMessage: message || "Logged in successfully",
      });

      return { success: true };
    } catch (error) {
      const message = error.message || "Unable to log in";

      set({
        token: null,
        user: null,
        isAuthenticated: false,
        status: "unauthenticated",
        error: message,
      });

      return { success: false, message };
    }
  },

  register: async (payload) => {
    set({ status: "loading", error: null, successMessage: null });

    try {
      const { message } = await authService.register(payload);

      set({
        status: "unauthenticated",
        error: null,
        successMessage: message,
      });

      return { success: true, message };
    } catch (error) {
      const message = error.message || "Unable to create account";

      set({
        status: "unauthenticated",
        error: message,
        successMessage: null,
      });

      return { success: false, message };
    }
  },

  completeOAuthLogin: ({ token, user }) => {
    if (!token || !user) {
      const message = "Google sign-in response is missing authentication data";

      set({
        token: null,
        user: null,
        isAuthenticated: false,
        status: "unauthenticated",
        error: message,
        successMessage: null,
      });

      return { success: false, message };
    }

    tokenStorage.setToken(token);
    tokenStorage.setUser(user);

    set({
      token,
      user,
      isAuthenticated: true,
      status: "authenticated",
      error: null,
      successMessage: "Signed in with Google",
    });

    return { success: true };
  },

  refreshProfile: async () => {
    try {
      const user = await profileService.getMyProfile();

      if (user) {
        tokenStorage.setUser(user);
        set({ user, error: null });
      }

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Unable to load profile right now",
      };
    }
  },

  updateProfile: async (payload) => {
    try {
      const user = await profileService.updateMyProfile(payload);

      if (user) {
        tokenStorage.setUser(user);
        set({
          user,
          error: null,
          successMessage: "Profile updated successfully",
        });
      }

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Unable to update profile right now",
      };
    }
  },

  updateProfileImage: async (file) => {
    try {
      const user = await profileService.updateProfileImage(file);

      if (user) {
        tokenStorage.setUser(user);
        set({
          user,
          error: null,
          successMessage: "Profile image updated successfully",
        });
      }

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Unable to update profile image right now",
      };
    }
  },

  logout: () => {
    socketService.disconnect();
    tokenStorage.clearAuth();

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      status: "unauthenticated",
      error: null,
      successMessage: null,
    });
  },

  clearMessages: () => {
    set({
      error: null,
      successMessage: null,
    });
  },
}));
