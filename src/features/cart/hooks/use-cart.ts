'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, remove, send } from '@/lib/http';
import type { Locale } from '@/lib/i18n';
import { withQuery } from '@/utils/url';
import { useSession } from '@/features/auth/hooks/use-auth';
import type { Cart, CartAdd } from '@/features/cart/types';

/**
 * The calls of `cart`, one hook per call, to our own /api/cart endpoints (D3-03; backend Area 5).
 * Every cart answer is the whole cart, so the screens show the backend's answer, never their own
 * sum. The coupon code is kept only in the cart page's memory and sent with each cart call
 * (Document 5, section 6.3); it is never stored in the browser.
 *
 * Only types come from `types.ts`: the header (every page) and the product page use these hooks,
 * and `types.ts` brings Zod (Document 7, 20.4).
 */
const CART_PATH = '/api/cart';
const CART_ITEMS_PATH = '/api/cart/items';
const UNAVAILABLE_LINES_PATH = '/api/cart/unavailable';
const PENDING_ADD_PATH = '/api/cart/pending';
const cartItemPath = (variantId: string) => `${CART_ITEMS_PATH}/${encodeURIComponent(variantId)}`;

const withCoupon = (path: string, couponCode: string) =>
  withQuery(path, { couponCode: couponCode.trim() || undefined });

export const cartKeys = {
  all: ['cart'] as const,
  view: (couponCode: string) => ['cart', couponCode] as const,
};

/**
 * The person's cart, with a coupon previewed when a code is given. Always read again when shown.
 * While a new code is checked the cart shown stays (`isPlaceholderData`), so the page is not
 * redrawn from a loading state and focus stays in the coupon field.
 */
export const useCart = (couponCode = '', enabled = true) =>
  useQuery({
    queryKey: cartKeys.view(couponCode),
    queryFn: () => get<Cart>(withCoupon(CART_PATH, couponCode)),
    placeholderData: keepPreviousData,
    staleTime: 0,
    enabled,
    refetchOnWindowFocus: true,
  });

/**
 * The number in the header's cart link: only for someone logged in; read again after every change
 * and on return to the tab.
 */
export function useCartCount(): number | null {
  const session = useSession();
  const isLoggedIn = Boolean(session.data?.user);
  const cart = useCart('', isLoggedIn);
  return isLoggedIn && cart.data ? cart.data.totals.itemCount : null;
}

/** A change to the cart: the answer is the new cart, shown at once; every cart view is then read again. */
function useCartChange<Input>(couponCode: string, change: (input: Input) => Promise<Cart>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: change,
    onSuccess: (cart) => queryClient.setQueryData(cartKeys.view(couponCode), cart),
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

/** Never repeated automatically: repeating it would add twice (Document 3, section 6). */
export const useAddToCart = () =>
  useCartChange('', (cartAdd: CartAdd) => send<Cart>(CART_ITEMS_PATH, cartAdd));

export const useChangeQuantity = (couponCode: string) =>
  useCartChange(couponCode, ({ variantId, quantity }: CartAdd) =>
    patch<Cart>(withCoupon(cartItemPath(variantId), couponCode), { quantity }),
  );

export const useRemoveLine = (couponCode: string) =>
  useCartChange(couponCode, (variantId: string) =>
    remove<Cart>(withCoupon(cartItemPath(variantId), couponCode)),
  );

export const useRemoveUnavailable = (couponCode: string) =>
  useCartChange(couponCode, () => remove<Cart>(withCoupon(UNAVAILABLE_LINES_PATH, couponCode)));

/**
 * "Add to cart" while logged out (D2-02): our server keeps the variant and quantity in a signed
 * cookie, with this page to come back to, and answers with the login address. The add runs once
 * in the login answer.
 */
export const useAddAfterLogin = () =>
  useMutation({
    mutationFn: (input: CartAdd & { lang: Locale }) =>
      send<{ login: string }>(PENDING_ADD_PATH, {
        ...input,
        next: window.location.pathname + window.location.search,
      }),
  });
