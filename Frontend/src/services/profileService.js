import { api } from "../lib/api";

const sanitizeUser = (user) => {
  if (!user) return null;

  const safeUser = { ...user };
  delete safeUser.password;

  return safeUser;
};

const extractProfile = (response) => sanitizeUser(response.data?.data || response.data?.user);

export const profileService = {
  async getMyProfile() {
    const response = await api.get("/profile/me");
    return extractProfile(response);
  },

  async getUserProfile(userId) {
    const response = await api.get(`/profile/users/${userId}`);
    return extractProfile(response);
  },

  async updateMyProfile(payload) {
    const response = await api.put("/profile/me", payload);
    return extractProfile(response);
  },

  async updateProfileImage(file) {
    const formData = new FormData();
    formData.append("profilePic", file);

    const response = await api.patch("/profile/me/photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return extractProfile(response);
  },
};
