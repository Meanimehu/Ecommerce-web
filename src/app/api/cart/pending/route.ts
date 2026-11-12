import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { isLocale } from '@/lib/i18n';
import { COOKIE, cookieOptions, isSafeLocalPath, LIFETIME_SECONDS, sign } from '@/middleware/cookies';
import { fail, guardChange, ok, readJson } from '@/middleware/responses';
import { rememberPageAfterLogin } from '@/features/auth/after-login-page';
import { PendingAddSchema } from '@/types/cart';

/**
 * POST /api/cart/pending: "Add to cart" by someone not logged in (Document 2, D2-02; Document 4, section 9). Only the
 * variant and the quantity are kept, signed, for 15 minutes, with the page to come back to. The add runs once, in the
 * login answer, which removes the cookie (D4-08).
 */
const Body = PendingAddSchema.extend({ next: z.string(), lang: z.string() });

export async function POST(request: NextRequest) {
  const refused = guardChange(request);
  if (refused) return refused;
  const body = Body.safeParse(await readJson(request));
  if (!body.success || !isSafeLocalPath(body.data.next)) return fail('VALIDATION_FAILED', 400);
  const lang = isLocale(body.data.lang) ? body.data.lang : 'en';
  const response = ok({ login: `/${lang}/login` });
  response.cookies.set(COOKIE.pendingAdd, sign({ v: body.data.variantId, q: body.data.quantity }), cookieOptions(LIFETIME_SECONDS.pendingAdd));
  rememberPageAfterLogin(response, body.data.next);
  return response;
}
