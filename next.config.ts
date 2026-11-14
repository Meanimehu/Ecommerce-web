import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A plain, self-contained Node.js server that any suitable host can run (Document 4, D4-03).
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // forbidden() for a real 403 "no access" page (Document 4, section 5; Document 2, section 5).
  // globalNotFound: one "not found" page, because the pages sit under a language segment (Document 4, section 10).
  // turbopackChunking.minChunkSize: with the default (50,000) the production build merged the shared button and
  // class-name code into three chunks on the login page, sending it three times (+40 KB). 10,000 keeps it in one
  // chunk; measured with the size check in tests/e2e/slice-0.spec.ts (Document 7, T7-2).
  experimental: {
    authInterrupts: true,
    globalNotFound: true,
    turbopackChunking: { minChunkSize: 10_000 },
  },
};

export default nextConfig;
