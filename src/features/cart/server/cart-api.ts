import 'server-only';
import { callBackend } from '@/api/client';
import { CartSchema, type CartAdd } from '@/features/cart/types';

/**
 * Backend Area 5, the cart (area-5-sales-cart-coupons.md, part 2). One function per backend
 * operation; every one answers the cart view. The coupon code is never stored: it is sent with each
 * call that should preview it.
 */
const CART_PATH = '/cart';
const CART_ITEMS_PATH = '/cart/items';
const UNAVAILABLE_LINES_PATH = '/cart/unavailable';
const cartItemPath = (variantId: string) => `${CART_ITEMS_PATH}/${encodeURIComponent(variantId)}`;

const couponQuery = (couponCode?: string) => (couponCode ? { couponCode } : undefined);

export const getCart = (token: string, couponCode?: string) =>
  callBackend({
    method: 'GET',
    path: CART_PATH,
    query: couponQuery(couponCode),
    kind: 'view',
    token,
    schema: CartSchema,
  });

export const addToCart = (token: string, body: CartAdd, couponCode?: string) =>
  callBackend({
    method: 'POST',
    path: CART_ITEMS_PATH,
    query: couponQuery(couponCode),
    kind: 'save',
    token,
    body,
    schema: CartSchema,
  });

export const changeQuantity = (
  token: string,
  variantId: string,
  body: Record<string, unknown>,
  couponCode?: string,
) =>
  callBackend({
    method: 'PATCH',
    path: cartItemPath(variantId),
    query: couponQuery(couponCode),
    kind: 'save',
    token,
    body,
    schema: CartSchema,
  });

export const removeLine = (token: string, variantId: string, couponCode?: string) =>
  callBackend({
    method: 'DELETE',
    path: cartItemPath(variantId),
    query: couponQuery(couponCode),
    kind: 'save',
    token,
    schema: CartSchema,
  });

export const removeUnavailable = (token: string, couponCode?: string) =>
  callBackend({
    method: 'DELETE',
    path: UNAVAILABLE_LINES_PATH,
    query: couponQuery(couponCode),
    kind: 'save',
    token,
    schema: CartSchema,
  });
