import type { CartLine } from '@/features/cart/types';

/**
 * The cart's enums and small rules, with no Zod (Document 7, section 16). The cart page's browser
 * code needs them but not the schemas in `types.ts`, which bring Zod (about 31 KB). This file
 * imports only types.
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

/** Lines that can no longer be bought; the backend clears them in one call (DELETE /cart/unavailable). */
export const isUnbuyable = (line: CartLine) =>
  line.status === LineStatus.Unavailable || line.status === LineStatus.OutOfStock;

/** Lines that need the person's attention: they cannot be bought as they are. */
export const hasProblem = (line: CartLine) =>
  isUnbuyable(line) || line.status === LineStatus.InsufficientStock;
