import axios from "axios";
import { getToken, removeToken } from "@/lib/auth";
import { getDeviceFingerprint, getDeviceName } from "@/lib/device-sign";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://oauth.nexaorion.cn",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Inject Authorization header and device info headers
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add device info headers for audit logging
  if (typeof window !== "undefined") {
    config.headers["X-Device-Fingerprint"] = getDeviceFingerprint();
    config.headers["X-Device-Name"] = getDeviceName();
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
