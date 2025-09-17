import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Enable experimental features for better static file handling
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Ensure proper headers for audio files
  async headers() {
    return [
      {
        source: '/api/uploads/audio/:filename*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
