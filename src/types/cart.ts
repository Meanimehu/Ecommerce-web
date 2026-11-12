import { z } from 'zod';

/**
 * Backend Area 5, the cart: the cart view every cart call answers, written by hand from the API reference (D3-01).
 * Source: Meanimehu/Ecommerce docs/api/reference/area-5-sales-cart-coupons.md, part 2. Stock numbers are never sent.
 */
export const LINE_STATUSES = ['ok', 'low_stock', 'insufficient_stock', 'out_of_stock', 'unavailable'] as const;
export type LineStatus = (typeof LINE_STATUSES)[number];

export const CartLineSchema = z.object({
  variantId: z.string(),
  productId: z.string(),
  title: z.string(),
  image: z.string().nullable(),
  sizeCode: z.string().nullable(),
  colourCode: z.string().nullable(),
  quantity: z.number().int(),
  unitPricePaise: z.number().int(),
  strikeThroughPaise: z.number().int().nullable(),
  discountPercent: z.number().int(),
  onSale: z.boolean(),
  saleEndsAt: z.string().nullable(),
  lineTotalPaise: z.number().int(),
  couponDiscountPaise: z.number().int(),
  status: z.enum(LINE_STATUSES),
  reason: z.string().nullable(),
});
export type CartLine = z.infer<typeof CartLineSchema>;

export const CartSchema = z.object({
  sellers: z.array(z.object({ vendorId: z.string().nullable(), vendorName: z.string().nullable(), subtotalPaise: z.number().int(), lines: z.array(CartLineSchema) })),
  totals: z.object({
    itemCount: z.number().int(),
    subtotalPaise: z.number().int(),
    mrpTotalPaise: z.number().int(),
    savingsPaise: z.number().int(),
    couponDiscountPaise: z.number().int(),
    totalWithoutCouponPaise: z.number().int(),
    estimatedTotalPaise: z.number().int(),
  }),
  canCheckout: z.boolean(),
  coupon: z.object({ code: z.string(), applied: z.boolean(), reason: z.string().nullable(), discountPaise: z.number().int().nullable().optional() }).nullable(),
  shipping: z.string(),
});
export type Cart = z.infer<typeof CartSchema>;

/** Lines the backend can clear in one call (DELETE /cart/unavailable). */
export const isUnbuyable = (line: CartLine) => line.status === 'unavailable' || line.status === 'out_of_stock';

/** What is kept while the person logs in (D2-02): only the variant and how many, never a price. */
export const PendingAddSchema = z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(10) });
export type PendingAdd = z.infer<typeof PendingAddSchema>;
