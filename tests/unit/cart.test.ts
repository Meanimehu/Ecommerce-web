import { describe, expect, it } from 'vitest';
import { decodePendingAdd, sign } from '@/middleware/cookies';
import { AddOutcome, isAddNotice } from '@/types/add-notice';
import { isUnbuyable, type CartLine } from '@/types/cart';

describe('the pending add (Document 2, D2-02)', () => {
  const variantId = '01a1a154-0367-773c-9d27-5989f07f5628';

  it('reads back only a signed variant and quantity', () => {
    expect(decodePendingAdd(sign({ v: variantId, q: 2 }))).toEqual({ variantId, quantity: 2 });
  });

  it('refuses an altered, unsigned or out-of-range value', () => {
    const good = sign({ v: variantId, q: 1 });
    expect(decodePendingAdd(`${good.split('.')[0]}.forged`)).toBeNull();
    expect(
      decodePendingAdd(Buffer.from(JSON.stringify({ v: variantId, q: 1 })).toString('base64url')),
    ).toBeNull();
    expect(decodePendingAdd(sign({ v: variantId, q: 11 }))).toBeNull();
    expect(decodePendingAdd(sign({ v: 'not-an-id', q: 1 }))).toBeNull();
    expect(decodePendingAdd(undefined)).toBeNull();
  });
});

describe('the add notice login hands to the next page (D2-02)', () => {
  it('accepts only a known outcome', () => {
    expect(isAddNotice({ outcome: AddOutcome.Added })).toBe(true);
    expect(isAddNotice({ outcome: AddOutcome.Failed, code: 'OUT_OF_STOCK' })).toBe(true);
    expect(isAddNotice({ outcome: 'maybe' })).toBe(false);
    expect(isAddNotice('added')).toBe(false);
    expect(isAddNotice(null)).toBe(false);
  });
});

describe('lines the backend can clear in one call', () => {
  const line = (status: CartLine['status']) => ({ status }) as CartLine;

  it('are the unavailable and out-of-stock lines only', () => {
    expect(isUnbuyable(line('unavailable'))).toBe(true);
    expect(isUnbuyable(line('out_of_stock'))).toBe(true);
    expect(isUnbuyable(line('insufficient_stock'))).toBe(false);
    expect(isUnbuyable(line('low_stock'))).toBe(false);
    expect(isUnbuyable(line('ok'))).toBe(false);
  });
});
