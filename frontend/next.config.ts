import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large base64 image bodies (4K images can be ~8MB as base64)
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },

  // Increase the default response body limit for API routes
  // This prevents truncation of large image responses from the Kaggle backend
  // Note: This option is set via a custom server or Vercel's vercel.json in production.
  // For local dev, the 25mb limit above is sufficient.
};

export default nextConfig;
