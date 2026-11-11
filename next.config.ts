import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A plain, self-contained Node.js server that any suitable host can run (Document 4, D4-03).
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // forbidden() for a real 403 "no access" page (Document 4, section 5; Document 2, section 5).
  // globalNotFound: one "not found" page, because the pages sit under a language segment (Document 4, section 10).
  experimental: { authInterrupts: true, globalNotFound: true },
};

export default nextConfig;
