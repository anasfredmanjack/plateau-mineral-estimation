import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { '/*': ['./data/naraguta.bin'] },
  // The server functions must include the workbook export at runtime.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
