import { z } from 'zod';
import { LineStatus, MAX_QUANTITY_PER_LINE } from '@/features/cart/rules';

/**
 * Backend Area 5, the cart: the cart view every cart call answers, written by hand from the API
 * reference (D3-01). Source: Meanimehu/Ecommerce docs/api/reference/area-5-sales-cart-coupons.md,
 * part 2. Stock numbers are never sent.
 *
 * This file brings Zod. Browser code takes only types from here, never values: the enums and small
 * rules it needs are in `rules.ts` (Document 7, section 16).
 */

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
  status: z.enum(LineStatus),
  reason: z.string().nullable(),
});
export type CartLine = z.infer<typeof CartLineSchema>;

export const CartSchema = z.object({
  sellers: z.array(
    z.object({
      vendorId: z.string().nullable(),
      vendorName: z.string().nullable(),
      subtotalPaise: z.number().int(),
      lines: z.array(CartLineSchema),
    }),
  ),
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
  coupon: z
    .object({
      code: z.string(),
      applied: z.boolean(),
      reason: z.string().nullable(),
      discountPaise: z.number().int().nullable().optional(),
    })
    .nullable(),
  shipping: z.string(),
});
export type Cart = z.infer<typeof CartSchema>;
export type CartCoupon = NonNullable<Cart['coupon']>;

/** One "Add to cart": the variant and how many, never a price (D2-02). */
export const CartAddSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});
export type CartAdd = z.infer<typeof CartAddSchema>;

/** "Add to cart" before logging in: the add, the page to come back to and its language. */
export const PendingAddRequestSchema = CartAddSchema.extend({ next: z.string(), lang: z.string() });
