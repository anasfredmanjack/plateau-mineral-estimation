import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-side rendering for API routes
  // For Vercel deployment, this works perfectly
  images: {
    unoptimized: true,
  },
  // Environment variables that should be available at build time
  env: {
    CUSTOM_KEY: 'my-value',
  },
};

export default nextConfig;
