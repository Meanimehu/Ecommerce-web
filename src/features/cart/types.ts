import { z } from 'zod';

/**
 * Backend Area 5, the cart: the cart view every cart call answers, written by hand from the API
 * reference (D3-01). Source: Meanimehu/Ecommerce docs/api/reference/area-5-sales-cart-coupons.md,
 * part 2. Stock numbers are never sent.
 *
 * This file brings Zod. The hooks every page uses (`hooks/use-cart.ts`: the header's count, the
 * product page's Add to cart) take only types from here, never values (Document 7, 20.4).
 */

/** The most of one item a cart line may hold (the backend's CART_MAX_QUANTITY_PER_LINE). */
export const MAX_QUANTITY_PER_LINE = 10;

/** What the backend says about one line, now. */
export enum LineStatus {
  Ok = 'ok',
  LowStock = 'low_stock',
  InsufficientStock = 'insufficient_stock',
  OutOfStock = 'out_of_stock',
  Unavailable = 'unavailable',
}

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

/** Lines that can no longer be bought; the backend clears them in one call (DELETE /cart/unavailable). */
export const isUnbuyable = (line: CartLine) =>
  line.status === LineStatus.Unavailable || line.status === LineStatus.OutOfStock;

/** Lines that need the person's attention: they cannot be bought as they are. */
export const hasProblem = (line: CartLine) =>
  isUnbuyable(line) || line.status === LineStatus.InsufficientStock;

/** One "Add to cart": the variant and how many, never a price (D2-02). */
export const CartAddSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});
export type CartAdd = z.infer<typeof CartAddSchema>;

/** "Add to cart" before logging in: the add, the page to come back to and its language. */
export const PendingAddRequestSchema = CartAddSchema.extend({ next: z.string(), lang: z.string() });
