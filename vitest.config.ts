import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  resolve: { alias: { '@': src } },
  test: {
    projects: [
      { extends: true, test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' } },
      // Needs a PostgreSQL server; each run creates and drops its own throwaway database (STORE_TEST_ADMIN_URL).
      { extends: true, test: { name: 'store', include: ['tests/store/**/*.test.ts'], environment: 'node', testTimeout: 20000, hookTimeout: 30000 } },
    ],
  },
});
