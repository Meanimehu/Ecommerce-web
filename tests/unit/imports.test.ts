import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/errors';
import { myImportPath, myImportsPath } from '@/lib/routes';
import { checkFile } from '@/lib/uploads';
import { isCurrentItem } from '@/features/layout/nav-items';
import { fileProblemsOf } from '@/features/product/hooks/use-import-upload';
import {
  canConfirmImport,
  ImportSchema,
  ImportState,
  importStateOf,
  ImportStatus,
  type ImportSummary,
} from '@/features/product/types';

/**
 * CSV import (Document 5, sections 7.3 and 11; area-3b-products.md, section 7): the answer's shape,
 * where an import stands, when it may be confirmed, and the file checks the browser makes first.
 */
const CHECKED = {
  id: '01a1a157-2c52-7482-971e-95f3df998e27',
  status: 'confirmed',
  fileName: 'mixed.csv',
  fileSha256: 'e26b',
  fileSizeBytes: 292,
  createdAt: '2026-11-03T12:16:47.185Z',
  expiresAt: '2026-11-04T12:16:47.185Z',
  expired: false,
  confirmedAt: '2026-11-03T12:16:47.211Z',
  totals: { rows: 3, validRows: 1, products: 2, validProducts: 1, createdProducts: 1 },
  products: [
    {
      productRef: 'GOOD-1',
      title: 'Cotton Dupatta',
      lines: [2],
      valid: true,
      errors: [],
      outcome: {
        created: true,
        productId: '01a1a157-2c79-78ba-a690-27718c1d65be',
        variantCount: 1,
        code: null,
        message: null,
      },
    },
    {
      productRef: 'BAD-1',
      title: 'Linen Kurta',
      lines: [3, 4],
      valid: false,
      errors: [{ code: 'CATEGORY_NOT_FOUND', column: 'category_slug', message: 'No category' }],
      outcome: {
        created: false,
        productId: null,
        variantCount: 0,
        code: 'CATEGORY_NOT_FOUND',
        message: 'Not created (from the preview): No category',
      },
    },
  ],
  rows: [
    { line: 2, productRef: 'GOOD-1', sku: 'DUP-1', valid: true, errors: [] },
    {
      line: 3,
      productRef: 'BAD-1',
      sku: 'LIN-1',
      valid: false,
      errors: [{ code: 'PRICE_INVALID', column: 'price_rupees', message: 'Over the MRP' }],
    },
  ],
};

const summary = (changes: Partial<ImportSummary>): ImportSummary => ({
  ...ImportSchema.parse(CHECKED),
  ...changes,
});

describe('a CSV import', () => {
  it('reads the backend’s answer, a whole-row problem included', () => {
    const parsed = ImportSchema.parse({
      ...CHECKED,
      rows: [
        { ...CHECKED.rows[1], errors: [{ column: null, code: 'VARIANT_LIMIT', message: 'x' }] },
      ],
    });
    expect(parsed.products[0]?.outcome?.created).toBe(true);
    expect(parsed.rows[0]?.errors[0]?.column).toBeNull();
  });

  it('is waiting, expired or confirmed', () => {
    expect(importStateOf({ status: ImportStatus.Previewed, expired: false })).toBe(
      ImportState.Waiting,
    );
    expect(importStateOf({ status: ImportStatus.Previewed, expired: true })).toBe(
      ImportState.Expired,
    );
    expect(importStateOf({ status: ImportStatus.Confirmed, expired: false })).toBe(
      ImportState.Confirmed,
    );
  });

  it('can be confirmed only while waiting and with a ready product', () => {
    const waiting = { status: ImportStatus.Previewed, expired: false };
    expect(canConfirmImport(summary(waiting))).toBe(true);
    expect(canConfirmImport(summary({ ...waiting, expired: true }))).toBe(false);
    expect(canConfirmImport(summary({ status: ImportStatus.Confirmed }))).toBe(false);
    const noneReady = { ...CHECKED.totals, validProducts: 0 };
    expect(canConfirmImport(summary({ ...waiting, totals: noneReady }))).toBe(false);
  });

  it('lists what the backend says is wrong with an unreadable file, and nothing else', () => {
    const invalid = new AppError({
      code: 'IMPORT_FILE_INVALID',
      status: 400,
      details: { problems: ['unknown column "foo"', 7] },
    });
    expect(fileProblemsOf(invalid)).toEqual(['unknown column "foo"']);
    expect(fileProblemsOf(new AppError({ code: 'IMPORT_FILE_INVALID', status: 400 }))).toEqual([]);
  });

  it('refuses at once only a file over 2 MB or a type that is plainly not a CSV', () => {
    expect(checkFile({ size: 3 * 1024 * 1024, type: 'text/csv' }, 'csv')).toBe('FILE_TOO_LARGE');
    expect(checkFile({ size: 100, type: 'image/png' }, 'csv')).toBe('FILE_TYPE_NOT_ALLOWED');
    for (const type of ['text/csv', 'application/vnd.ms-excel', '']) {
      expect(checkFile({ size: 100, type }, 'csv')).toBeNull();
    }
  });

  it('lives under the vendor’s imports, which belong to Products in the menu', () => {
    expect(myImportPath('hi', 'a/b')).toBe('/hi/vendor/imports/a%2Fb');
    const products = { href: '/en/vendor/products', label: 'Products', icon: 'products' as const };
    expect(
      isCurrentItem({ ...products, alsoUnder: [myImportsPath('en')] }, '/en/vendor/imports/x'),
    ).toBe(true);
    expect(isCurrentItem(products, '/en/vendor/imports')).toBe(false);
  });
});
