import 'server-only';
import { CartSchema } from '@/types/cart';
import { callBackend } from './client';

/**
 * Backend Area 5, the cart (area-5-sales-cart-coupons.md, part 2). Every call answers the cart view. The coupon code is
 * never stored: it is sent with each call that should preview it.
 */
const query = (couponCode?: string) => (couponCode ? { couponCode } : undefined);

export const getCart = (token: string, couponCode?: string) => callBackend({ method: 'GET', path: '/cart', query: query(couponCode), kind: 'view', token, schema: CartSchema });

export const addToCart = (token: string, body: { variantId: string; quantity: number }, couponCode?: string) =>
  callBackend({ method: 'POST', path: '/cart/items', query: query(couponCode), kind: 'save', token, body, schema: CartSchema });

export const changeQuantity = (token: string, variantId: string, body: Record<string, unknown>, couponCode?: string) =>
  callBackend({ method: 'PATCH', path: `/cart/items/${encodeURIComponent(variantId)}`, query: query(couponCode), kind: 'save', token, body, schema: CartSchema });

export const removeLine = (token: string, variantId: string, couponCode?: string) =>
  callBackend({ method: 'DELETE', path: `/cart/items/${encodeURIComponent(variantId)}`, query: query(couponCode), kind: 'save', token, schema: CartSchema });

export const removeUnavailable = (token: string, couponCode?: string) =>
  callBackend({ method: 'DELETE', path: '/cart/unavailable', query: query(couponCode), kind: 'save', token, schema: CartSchema });
