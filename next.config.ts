import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "media.api-football.com",
      "api-football.com",
      "upload.wikimedia.org",
    ],
  }
};

export default nextConfig;
