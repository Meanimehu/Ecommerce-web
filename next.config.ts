import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A plain, self-contained Node.js server that any suitable host can run (Document 4, D4-03).
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
