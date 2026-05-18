import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { tokenStorage } from "./tokenStorage";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    if (status === 401) {
      tokenStorage.clearAuth();
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    return Promise.reject({
      status,
      message,
      details: error.response?.data,
    });
  },
);
