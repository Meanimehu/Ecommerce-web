import { describe, expect, it } from 'vitest';
import { saleDefaults } from '@/features/sales/hooks/use-sale-form';
import { canCancelSale, SaleStatus } from '@/features/sales/rules';
import { isoToIst, istToIso, newSale, SaleFormSchema } from '@/features/sales/types';

describe('sale prices (Document 5, section 8.2; area-5-sales-cart-coupons.md, part 1)', () => {
  it('reads a time typed in IST and gives it back the same', () => {
    expect(istToIso('2026-11-10T10:00')).toBe('2026-11-10T04:30:00.000Z');
    expect(isoToIst('2026-11-10T04:30:00.000Z')).toBe('2026-11-10T10:00');
  });

  it('sends the price in paise and the times from IST', () => {
    const values = SaleFormSchema.parse({
      variantId: 'v1',
      salePrice: '1,299.50',
      startsAt: '2026-11-10T10:00',
      endsAt: '2026-11-17T10:00',
    });
    expect(newSale(values)).toEqual({
      variantId: 'v1',
      salePricePaise: 129950,
      startsAt: '2026-11-10T04:30:00.000Z',
      endsAt: '2026-11-17T04:30:00.000Z',
    });
  });

  it('checks only the shape: a variant, a price in rupees, both times', () => {
    const good = {
      variantId: 'v1',
      salePrice: '999',
      startsAt: '2026-11-10T10:00',
      endsAt: '2026-11-11T10:00',
    };
    expect(SaleFormSchema.safeParse(good).success).toBe(true);
    expect(SaleFormSchema.safeParse({ ...good, variantId: '' }).success).toBe(false);
    expect(SaleFormSchema.safeParse({ ...good, salePrice: '9.999' }).success).toBe(false);
    expect(SaleFormSchema.safeParse({ ...good, endsAt: '' }).success).toBe(false);
  });

  it('starts a new sale at the next whole hour, for a week', () => {
    const defaults = saleDefaults(Date.parse('2026-11-16T05:10:00Z'));
    expect(defaults.startsAt).toBe('2026-11-16T11:30');
    expect(defaults.endsAt).toBe('2026-11-23T11:30');
  });

  it('only an upcoming or active sale can be cancelled', () => {
    expect(canCancelSale(SaleStatus.Upcoming)).toBe(true);
    expect(canCancelSale(SaleStatus.Active)).toBe(true);
    expect(canCancelSale(SaleStatus.Ended)).toBe(false);
    expect(canCancelSale(SaleStatus.Cancelled)).toBe(false);
  });
});
