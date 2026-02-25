import axios from "axios";
import { getToken, removeToken } from "@/lib/auth";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://oauth.nexaorion.cn",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Inject Authorization header
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default http;
