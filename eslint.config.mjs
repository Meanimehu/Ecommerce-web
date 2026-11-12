import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Files rewritten to the code-style rules (Document 7, section 20). Each clean-up pull request adds
 * its area here; when every area is done this becomes all of src/.
 */
const codeStyleFiles = [
  'scripts/gen-error-codes.ts',
  'src/lib/error-codes.ts',
  'src/lib/errors.ts',
  'src/lib/http.ts',
  'src/lib/http-status.ts',
  'src/hooks/use-app-form.ts',
  'src/features/auth/hooks/use-login.ts',
  'src/features/auth/hooks/use-login-form.ts',
  'src/features/auth/hooks/use-session.ts',
  'src/features/auth/server/auth-api.ts',
  'src/features/auth/types.ts',
  'src/app/api/auth/code/route.ts',
  'src/app/api/auth/verify/route.ts',
  'src/app/[[]lang]/login/page.tsx',
  'src/features/auth/components/login-form.tsx',
  'src/components/form/form.tsx',
  'src/types/react-query.d.ts',
  'src/types/add-notice.ts',
  'tests/unit/error-codes.test.ts',
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: codeStyleFiles,
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
