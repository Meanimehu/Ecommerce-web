import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A plain, self-contained Node.js server that any suitable host can run (Document 4, D4-03).
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // forbidden() for a real 403 "no access" page (Document 4, section 5; Document 2, section 5).
  experimental: { authInterrupts: true },
};

export default nextConfig;
