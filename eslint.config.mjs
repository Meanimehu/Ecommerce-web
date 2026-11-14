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
  'src/lib/server-log.ts',
  'src/features/auth/**/*.{ts,tsx}',
  'src/features/vendor/**/*.{ts,tsx}',
  'src/features/catalogue/**/*.{ts,tsx}',
  'src/app/api/admin/catalogue/**/*.ts',
  'src/app/[[]lang]/admin/catalogue/**/*.tsx',
  'src/features/product/**/*.{ts,tsx}',
  'src/features/storefront/**/*.{ts,tsx}',
  'src/app/api/catalogue/categories/route.ts',
  'src/app/api/catalogue/products/**/*.ts',
  'src/app/[[]lang]/category/**/*.tsx',
  'src/app/[[]lang]/product/**/*.tsx',
  'tests/unit/storefront.test.ts',
  'src/app/api/moderation/**/*.ts',
  'src/app/api/catalogue/dictionaries/route.ts',
  'src/app/[[]lang]/admin/moderation/**/*.tsx',
  'src/components/common/photo-frame.tsx',
  'src/hooks/use-category-tree.ts',
  'src/app/api/vendors/**/*.ts',
  'src/app/api/admin/vendors/**/*.ts',
  'src/app/[[]lang]/vendor/**/*.tsx',
  'src/app/[[]lang]/admin/vendors/**/*.tsx',
  'src/app/[[]lang]/account/page.tsx',
  'src/app/api/auth/**/*.ts',
  'src/app/api/session/route.ts',
  'src/hooks/use-app-form.ts',
  'src/app/[[]lang]/login/page.tsx',
  'src/components/form/form.tsx',
  'src/types/react-query.d.ts',
  'src/types/add-notice.ts',
  'tests/unit/error-codes.test.ts',
  'tests/unit/product.test.ts',
  'tests/unit/routes.test.ts',
  'src/lib/routes.ts',
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
