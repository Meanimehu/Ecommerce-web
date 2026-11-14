import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n';
import { loginPath } from '@/lib/routes';
import { isSafeLocalPath } from '@/middleware/cookies';
import { fail, guardChange, ok, readJson } from '@/middleware/responses';
import { rememberPageAfterLogin } from '@/features/auth/after-login-page';
import { keepPendingAdd } from '@/features/cart/server/pending-add';
import { PendingAddRequestSchema } from '@/features/cart/types';

/**
 * POST /api/cart/pending: "Add to cart" by someone not logged in (Document 2, D2-02; Document 4, section 9). The add is
 * kept by `cart` (server/pending-add.ts), with the page to come back to; the answer is the login address. The add runs
 * once, in the login answer, which removes the cookie (D4-08).
 */
export async function POST(request: NextRequest) {
  const refusedByForgeryCheck = guardChange(request);
  if (refusedByForgeryCheck) return refusedByForgeryCheck;
  const body = PendingAddRequestSchema.safeParse(await readJson(request));
  if (!body.success || !isSafeLocalPath(body.data.next))
    return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  const lang = isLocale(body.data.lang) ? body.data.lang : DEFAULT_LOCALE;
  const response = ok({ login: loginPath(lang) });
  keepPendingAdd(response, { variantId: body.data.variantId, quantity: body.data.quantity });
  rememberPageAfterLogin(response, body.data.next);
  return response;
}
