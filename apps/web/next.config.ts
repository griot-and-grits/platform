import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '.apps.*.opentlc.com',
  ],
};

export default nextConfig;
