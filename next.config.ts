import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Configure webpack to completely ignore the ffmpeg-related packages
  webpack: (config) => {
    // Add modules that should be treated as external and not bundled
    config.externals = [
      ...(config.externals || []),
      // Ignore ffmpeg-related packages entirely
      'fluent-ffmpeg',
      'ffmpeg-static',
      '@ffprobe-installer/ffprobe'
    ];
    
    return config;
  },
};

export default nextConfig;
