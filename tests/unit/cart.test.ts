import { describe, expect, it } from 'vitest';
import { sign } from '@/middleware/cookies';
import { decodePendingAdd } from '@/features/cart/server/pending-add';
import { AddOutcome, isAddNotice } from '@/lib/add-notice';
import { hasProblem, isUnbuyable, LineStatus, type CartLine } from '@/features/cart/types';

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
  const line = (status: LineStatus) => ({ status }) as CartLine;

  it('are the unavailable and out-of-stock lines only', () => {
    expect(isUnbuyable(line(LineStatus.Unavailable))).toBe(true);
    expect(isUnbuyable(line(LineStatus.OutOfStock))).toBe(true);
    expect(isUnbuyable(line(LineStatus.InsufficientStock))).toBe(false);
    expect(isUnbuyable(line(LineStatus.LowStock))).toBe(false);
    expect(isUnbuyable(line(LineStatus.Ok))).toBe(false);
  });
});

describe('lines that need attention', () => {
  const line = (status: LineStatus) => ({ status }) as CartLine;

  it('are the ones that cannot be bought as they are', () => {
    expect(hasProblem(line(LineStatus.Unavailable))).toBe(true);
    expect(hasProblem(line(LineStatus.OutOfStock))).toBe(true);
    expect(hasProblem(line(LineStatus.InsufficientStock))).toBe(true);
    expect(hasProblem(line(LineStatus.LowStock))).toBe(false);
    expect(hasProblem(line(LineStatus.Ok))).toBe(false);
  });
});
