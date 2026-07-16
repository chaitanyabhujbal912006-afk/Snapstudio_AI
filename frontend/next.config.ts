import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large base64 image bodies (4K images can be ~8 MB as base64)
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },

  // Forward large response bodies from API routes (Kaggle images)
  // This is enforced via response size limit in the custom route config.
  // Note: Vercel honours the 'functions' key in vercel.json for maxDuration.

  // Silence specific ESLint/TS warnings during production build
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
