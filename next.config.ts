import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'imageservice-e438b.firebasestorage.app',
      'imagedelivery.net', // Cloudflare Images
      'pub-6bf4a904aafa41fa97c990c1f72c0f5e.r2.dev', // Cloudflare R2
    ],
  },
};

export default nextConfig;
