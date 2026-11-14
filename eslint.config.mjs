import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // The code-style rules for all our code (Document 7, section 20).
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts', 'scripts/**/*.{ts,mjs}'],
    rules: {
      'id-length': ['error', { min: 2, properties: 'never' }],
      'no-nested-ternary': 'error',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/types/generated/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);
