import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // serverActions is now enabled by default, remove it from experimental
  allowedDevOrigins: ['10.36.98.171', 'localhost', '127.0.0.1'],
  // Remove 'eslint' and 'typescript' from here - they go in package.json
};

export default nextConfig;