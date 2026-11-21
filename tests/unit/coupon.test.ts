import { describe, expect, it } from 'vitest';
import { getMessages } from '@/lib/messages';
import { discountText, usedText } from '@/features/coupon/components/coupon-text';
import {
  changedCoupon,
  CouponFormSchema,
  couponFormDefaults,
  CouponSchema,
  DiscountType,
  FundedBy,
  newCoupon,
  type CouponFormInput,
} from '@/features/coupon/types';

/**
 * The staff's coupons (Document 5, section 8.3; area-5-sales-cart-coupons.md, part 3): the answer's
 * shape, what the form sends for a new coupon and for a change, and the terms in words.
 */
const VENDOR = '01a1a153-ffcb-740b-aceb-16884d91de35';
const FESTIVE = CouponSchema.parse({
  id: '01a1a15c-80f1-7cca-800f-4c01323ed8c0',
  code: 'FESTIVE10',
  status: 'active',
  discountType: 'percent',
  value: 1000,
  maxDiscountPaise: 50000,
  minCartPaise: 100000,
  startsAt: '2026-11-03T12:22:36.000Z',
  endsAt: '2027-01-02T12:22:36.000Z',
  usageLimit: 1000,
  perUserLimit: 1,
  fundedBy: 'marketplace',
  vendorId: null,
  marketplaceShareBps: 10000,
  excludeSaleItems: true,
  categoryIds: [],
  productIds: [],
  termsDigest: '1aa3',
  maxExposurePaise: 0,
  vendorAcceptedAt: null,
  vendorAcceptedBy: null,
  vendorAcceptedDigest: null,
  requestId: null,
  createdBy: 'x',
  createdAt: '2026-11-03T12:22:36.528Z',
  updatedAt: '2026-11-03T12:22:36.528Z',
  usage: { held: 12, released: 0, remaining: 988, overLimitReclaims: 0 },
});

const filled = (changes: Partial<CouponFormInput>) =>
  CouponFormSchema.parse({ ...couponFormDefaults(), code: 'festive10', value: '10', ...changes });

describe('the staff’s coupon form', () => {
  it('sends a new marketplace coupon with only the terms typed, in the backend’s units', () => {
    expect(
      newCoupon(
        filled({
          maxDiscount: '500',
          minCart: '1000',
          usageLimit: '1000',
          startsAt: '2026-11-25T10:00',
        }),
      ),
    ).toEqual({
      code: 'FESTIVE10',
      discountType: 'percent',
      value: 1000,
      fundedBy: 'marketplace',
      maxDiscountPaise: 50000,
      minCartPaise: 100000,
      startsAt: '2026-11-25T04:30:00.000Z',
      usageLimit: 1000,
      excludeSaleItems: false,
      categoryIds: [],
      productIds: [],
    });
  });

  it('sends a fixed amount in paise, a split share in basis points and the product ids typed', () => {
    const body = newCoupon(
      filled({
        discountType: DiscountType.Fixed,
        value: '199.50',
        fundedBy: FundedBy.Split,
        vendorId: VENDOR,
        marketplaceShare: '40',
        productIds: `${VENDOR}\n ${VENDOR.replace('16884', '16885')}`,
      }),
    );
    expect(body).toMatchObject({ value: 19950, vendorId: VENDOR, marketplaceShareBps: 4000 });
    expect(body.productIds).toHaveLength(2);
  });

  it('needs a full vendor id when the vendor pays, a share when shared, and a sound code', () => {
    const vendorPaid = CouponFormSchema.safeParse({
      ...couponFormDefaults(),
      code: 'AB12',
      value: '5',
      fundedBy: FundedBy.Vendor,
    });
    expect(vendorPaid.success).toBe(false);
    const split = CouponFormSchema.safeParse({
      ...couponFormDefaults(),
      code: 'AB12',
      value: '5',
      fundedBy: FundedBy.Split,
      vendorId: VENDOR,
    });
    expect(split.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['marketplaceShare']);
    const badCode = CouponFormSchema.safeParse({
      ...couponFormDefaults(),
      code: 'a b',
      value: '5',
    });
    expect(badCode.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['code']);
  });

  it('starts a change from the coupon’s own terms', () => {
    expect(couponFormDefaults(FESTIVE)).toMatchObject({
      code: 'FESTIVE10',
      value: '10',
      maxDiscount: '500',
      minCart: '1000',
      startsAt: '2026-11-03T17:52',
      usageLimit: '1000',
      excludeSaleItems: true,
    });
  });

  it('sends only the changed terms, and an emptied limit as null', () => {
    const values = CouponFormSchema.parse({
      ...couponFormDefaults(FESTIVE),
      endsAt: '',
      usageLimit: '2000',
    });
    expect(changedCoupon(values, { endsAt: true, usageLimit: true })).toEqual({
      endsAt: null,
      usageLimit: 2000,
    });
    expect(changedCoupon(values, {})).toEqual({});
  });

  it('says the terms in words', () => {
    const messages = getMessages('en');
    expect(discountText(FESTIVE, messages)).toBe('10% off, at most ₹500');
    expect(usedText(FESTIVE, messages)).toBe('12 of 1000');
    expect(usedText({ ...FESTIVE, usageLimit: null }, messages)).toBe('12, no limit');
  });
});
