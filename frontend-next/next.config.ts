import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // Standalone output keeps the Cloud Run Docker image small.
  output: "standalone",
  // Pin the workspace root (a stray lockfile in the home dir confuses inference).
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
