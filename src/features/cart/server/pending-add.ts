import 'server-only';
import type { NextRequest, NextResponse } from 'next/server';
import { AddOutcome, type AddNotice } from '@/lib/add-notice';
import { AppError } from '@/lib/errors';
import {
  COOKIE,
  cookieOptions,
  deleteCookie,
  LIFETIME_SECONDS,
  sign,
  unsign,
} from '@/middleware/cookies';
import { MAX_QUANTITY_PER_LINE, type CartAdd } from '@/features/cart/types';
import * as cartApi from './cart-api';

/**
 * The "Add to cart" that waits for login (Document 2, D2-02; Document 4, section 9), all in one
 * place: `cart` decides what its signed cookie means, writes it, reads it and runs the add
 * (Document 7, 20.4). Only the variant and the quantity are kept, for 15 minutes. The login
 * endpoint asks this file to run the add, so `auth` never calls the cart.
 */

/** A variant id as the backend writes it (a UUID). */
const VARIANT_ID_SHAPE = /^[0-9a-f-]{36}$/i;

/** Keeps the add in this answer's signed cookie. The cookie stores short keys: v and q. */
export function keepPendingAdd(response: NextResponse, cartAdd: CartAdd): void {
  response.cookies.set(
    COOKIE.pendingAdd,
    sign({ v: cartAdd.variantId, q: cartAdd.quantity }),
    cookieOptions(LIFETIME_SECONDS.pendingAdd),
  );
}

/** The add kept in the cookie, or null when it is missing, altered or malformed. */
export function decodePendingAdd(cookieValue: string | undefined): CartAdd | null {
  const kept = unsign<{ v?: unknown; q?: unknown }>(cookieValue);
  if (typeof kept?.v !== 'string' || !VARIANT_ID_SHAPE.test(kept.v)) return null;
  const quantity = kept.q;
  if (typeof quantity !== 'number' || !Number.isInteger(quantity)) return null;
  if (quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) return null;
  return { variantId: kept.v, quantity };
}

/**
 * Runs the add kept in the request's cookie once, as a normal cart request against the product,
 * price and stock of this moment. Nothing kept: nothing to say. An add whose outcome is unknown is
 * not repeated; the page tells the person instead.
 */
export async function runPendingAdd(
  request: NextRequest,
  accessToken: string,
): Promise<AddNotice | undefined> {
  const pendingAdd = decodePendingAdd(request.cookies.get(COOKIE.pendingAdd)?.value);
  if (!pendingAdd) return undefined;
  try {
    await cartApi.addToCart(accessToken, pendingAdd);
    return { outcome: AddOutcome.Added };
  } catch (error) {
    if (error instanceof AppError && !error.outcomeUnknown) {
      return { outcome: AddOutcome.Failed, code: error.code };
    }
    return { outcome: AddOutcome.Unknown };
  }
}

/** The cookie is used once, whatever the outcome (D4-08). */
export function forgetPendingAdd(response: NextResponse): void {
  deleteCookie(response, COOKIE.pendingAdd);
}
