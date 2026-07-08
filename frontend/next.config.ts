import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Next.js server routes to make long-running fetch calls (e.g. Gradio SSE polling)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

