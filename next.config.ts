import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '40mb', 
    },
  },
  // Afuera:
  allowedDevOrigins: ['192.168.100.21'], 
};

export default nextConfig;