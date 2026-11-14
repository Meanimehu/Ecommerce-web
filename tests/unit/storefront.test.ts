import { describe, expect, it } from 'vitest';
import { decodePendingAdd, sign } from '@/middleware/cookies';
import { productPath, productSlug } from '@/features/storefront/types';

describe('product addresses (Document 4, D4-02)', () => {
  it('makes the readable part from the title', () => {
    expect(productSlug('Chanderi Cotton Anarkali Dress')).toBe('chanderi-cotton-anarkali-dress');
    expect(productSlug('  Kurta — Indigo / 100% cotton!  ')).toBe('kurta-indigo-100-cotton');
    expect(productSlug('Crème brûlée')).toBe('creme-brulee');
  });

  it('never leaves the readable part empty', () => {
    expect(productSlug('कुर्ता')).toBe('product');
  });

  it('builds the full address', () => {
    expect(productPath('hi', 'abc', 'Slim Fit Chinos')).toBe('/hi/product/abc/slim-fit-chinos');
  });
});

describe('the pending add (Document 2, D2-02)', () => {
  const variantId = '01a1a154-0367-773c-9d27-5989f07f5628';

  it('reads back only a signed variant and quantity', () => {
    expect(decodePendingAdd(sign({ v: variantId, q: 2 }))).toEqual({ variantId, quantity: 2 });
  });

  it('refuses an altered, unsigned or out-of-range value', () => {
    const good = sign({ v: variantId, q: 1 });
    expect(decodePendingAdd(`${good.split('.')[0]}.forged`)).toBeNull();
    expect(decodePendingAdd(Buffer.from(JSON.stringify({ v: variantId, q: 1 })).toString('base64url'))).toBeNull();
    expect(decodePendingAdd(sign({ v: variantId, q: 11 }))).toBeNull();
    expect(decodePendingAdd(sign({ v: 'not-an-id', q: 1 }))).toBeNull();
    expect(decodePendingAdd(undefined)).toBeNull();
  });
});
