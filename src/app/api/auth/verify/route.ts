import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { isLocale } from '@/lib/i18n';
import * as authApi from '@/api/auth';
import * as cartApi from '@/api/cart';
import { AppError } from '@/lib/errors';
import { COOKIE, cookieOptions, decodeNext, decodePendingAdd } from '@/middleware/cookies';
import { fail, fromAppError, guardChange, ok, readJson, setSessionCookies } from '@/middleware/responses';
import { defaultDestination } from '@/middleware/session';

/**
 * POST /api/auth/verify: checks the code with the backend and, on success, sets the login cookies (Document 2,
 * D2-01). The person then goes to the page they asked for, else the default for their role (D2-03).
 * A pending "Add to cart" (D2-02) runs here, once: this answer removes its cookie whatever happens (D4-08), and an add
 * whose outcome is unknown is not repeated; the answer says what happened so the page can tell the person.
 */
const Body = z.object({ phone: z.string().trim().min(1).max(20), code: z.string().trim().min(1).max(12), lang: z.string() });

export async function POST(request: NextRequest) {
  const refused = guardChange(request);
  if (refused) return refused;
  const body = Body.safeParse(await readJson(request));
  if (!body.success) return fail('VALIDATION_FAILED', 400);
  const lang = isLocale(body.data.lang) ? body.data.lang : 'en';
  try {
    const { data } = await authApi.verifyLoginCode({ phone: body.data.phone, code: body.data.code });
    const asked = decodeNext(request.cookies.get(COOKIE.next)?.value);
    const destination = asked ?? defaultDestination(data.user.roles, lang);
    const pending = decodePendingAdd(request.cookies.get(COOKIE.pendingAdd)?.value);
    const pendingAdd = pending ? await runPendingAdd(data.accessToken, pending) : undefined;
    const response = ok({ user: data.user, destination, ...(pendingAdd ? { pendingAdd } : {}) });
    setSessionCookies(response, { accessToken: data.accessToken, expiresIn: data.expiresIn, refreshToken: data.refreshToken });
    response.cookies.set(COOKIE.next, '', cookieOptions(0));
    response.cookies.set(COOKIE.pendingAdd, '', cookieOptions(0));
    return response;
  } catch (error) {
    return fromAppError(error);
  }
}

/** The add, as a normal cart request checked against the product, price and stock of this moment (Document 2, section 3). */
async function runPendingAdd(token: string, pending: { variantId: string; quantity: number }): Promise<{ outcome: 'added' | 'failed' | 'unknown'; code?: string }> {
  try {
    await cartApi.addToCart(token, pending);
    return { outcome: 'added' };
  } catch (error) {
    if (error instanceof AppError && !error.outcomeUnknown) return { outcome: 'failed', code: error.code };
    return { outcome: 'unknown' };
  }
}
