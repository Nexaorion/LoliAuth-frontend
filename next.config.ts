import type { NextConfig } from "next";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
      {
        source: "/oauth/:path*",
        destination: `${API_BASE_URL}/oauth/:path*`,
      },
      {
        source: "/health",
        destination: `${API_BASE_URL}/health`,
      },
      {
        source: "/.well-known/:path*",
        destination: `${API_BASE_URL}/.well-known/:path*`,
      },
      {
        source: "/userinfo",
        destination: `${API_BASE_URL}/userinfo`,
      },
    ];
  },
};

export default nextConfig;
