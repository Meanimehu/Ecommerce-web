'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, remove, send } from '@/lib/http';
import type { Locale } from '@/lib/i18n';
import type { Cart } from '@/types/cart';
import { withQuery } from '@/utils/url';
import { useSession } from './use-session';

/**
 * The cart (backend Area 5), through our /api/cart endpoints. Every cart answer is the whole cart, so the screen shows
 * the backend's answer, never its own sum. The coupon code is kept only in the cart page's memory and sent with each
 * cart call (Document 5, section 6.3); it is never stored in the browser.
 */
export const cartKeys = { all: ['cart'] as const, view: (couponCode: string) => ['cart', couponCode] as const };

const withCoupon = (path: string, couponCode: string) => withQuery(path, { couponCode: couponCode.trim() || undefined });

export function useCart(couponCode = '', enabled = true) {
  return useQuery({ queryKey: cartKeys.view(couponCode), queryFn: () => get<Cart>(withCoupon('/api/cart', couponCode)), staleTime: 0, enabled, refetchOnWindowFocus: true });
}

/** The number in the header's cart link: only for someone logged in; refreshed after every change and on return to the tab. */
export function useCartCount(): number | null {
  const session = useSession();
  const cart = useCart('', Boolean(session.data?.user));
  return session.data?.user && cart.data ? cart.data.totals.itemCount : null;
}

/** A change to the cart: the answer is the new cart, shown at once; every cart view is then read again. */
function useCartChange<TInput>(couponCode: string, run: (input: TInput) => Promise<Cart>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (cart) => queryClient.setQueryData(cartKeys.view(couponCode), cart),
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export const useAddToCart = () => useCartChange('', (input: { variantId: string; quantity: number }) => send<Cart>('/api/cart/items', input));
export const useChangeQuantity = (couponCode: string) =>
  useCartChange(couponCode, ({ variantId, quantity }: { variantId: string; quantity: number }) => patch<Cart>(withCoupon(`/api/cart/items/${encodeURIComponent(variantId)}`, couponCode), { quantity }));
export const useRemoveLine = (couponCode: string) => useCartChange(couponCode, (variantId: string) => remove<Cart>(withCoupon(`/api/cart/items/${encodeURIComponent(variantId)}`, couponCode)));
export const useRemoveUnavailable = (couponCode: string) => useCartChange(couponCode, () => remove<Cart>(withCoupon('/api/cart/unavailable', couponCode)));

/**
 * "Add to cart" while logged out (D2-02): our server keeps the variant and quantity in a signed cookie, then the person
 * logs in and comes back to this page; the add runs once in the login answer.
 */
export async function addAfterLogin(input: { variantId: string; quantity: number; lang: Locale }): Promise<void> {
  const next = window.location.pathname + window.location.search;
  const answer = await send<{ login: string }>('/api/cart/pending', { ...input, next });
  // A full page load on purpose: the login page is rendered on the server.
  window.location.assign(answer.login);
}

/** What the login answer said about a pending add, kept for the page the person returns to, shown once. */
export type AddNotice = { outcome: 'added' | 'failed' | 'unknown'; code?: string };
const NOTICE_KEY = 'dhaaga:pending-add';

export function keepAddNotice(notice: AddNotice): void {
  try {
    sessionStorage.setItem(NOTICE_KEY, JSON.stringify(notice));
  } catch {
    // Storage may be unavailable: the cart still shows what is there.
  }
}

export function takeAddNotice(): AddNotice | null {
  try {
    const raw = sessionStorage.getItem(NOTICE_KEY);
    sessionStorage.removeItem(NOTICE_KEY);
    const value = raw ? (JSON.parse(raw) as AddNotice) : null;
    return value && (value.outcome === 'added' || value.outcome === 'failed' || value.outcome === 'unknown') ? value : null;
  } catch {
    return null;
  }
}
