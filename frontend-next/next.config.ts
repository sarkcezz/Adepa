import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vercel Blob (product/event/announcement images).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  // Pin the workspace root (a stray lockfile in the home dir confuses inference).
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
