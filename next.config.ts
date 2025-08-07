import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'imageservice-e438b.firebasestorage.app',
    ],
  },
};

export default nextConfig;
