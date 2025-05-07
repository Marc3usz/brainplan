import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google profile images
      'ui-avatars.com', // Default avatar service
    ],
  },
};

export default nextConfig;
