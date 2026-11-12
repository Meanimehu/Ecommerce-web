import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { BackendErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { HttpStatus } from '@/lib/http-status';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';
import { COOKIE, cookieOptions, decodeNext, decodePendingAdd } from '@/middleware/cookies';
import {
  fail,
  fromAppError,
  guardChange,
  ok,
  readJson,
  setSessionCookies,
} from '@/middleware/responses';
import * as authApi from '@/features/auth/server/auth-api';
import * as cartApi from '@/api/cart';
import { defaultDestination } from '@/features/auth/server/session';
import { AddOutcome, type AddNotice } from '@/types/add-notice';

/**
 * POST /api/auth/verify: checks the code with the backend and, when it is right, sets the login
 * cookies (D2-01). The answer says where to go next: the page the person asked for, else the
 * default for their role (D2-03).
 */
const VerifyCodeBody = z.object({
  phone: z.string().trim().min(1).max(20),
  code: z.string().trim().min(1).max(12),
  lang: z.string(),
});

export async function POST(request: NextRequest) {
  const refusedByForgeryCheck = guardChange(request);
  if (refusedByForgeryCheck) return refusedByForgeryCheck;

  const body = VerifyCodeBody.safeParse(await readJson(request));
  if (!body.success) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);

  const lang: Locale = isLocale(body.data.lang) ? body.data.lang : DEFAULT_LOCALE;

  try {
    const { data: login } = await authApi.verifyLoginCode({
      phone: body.data.phone,
      code: body.data.code,
    });

    const askedForPage = decodeNext(request.cookies.get(COOKIE.next)?.value);
    const destination = askedForPage ?? defaultDestination(login.user.roles, lang);

    const pendingAdd = decodePendingAdd(request.cookies.get(COOKIE.pendingAdd)?.value);
    const pendingAddResult = pendingAdd
      ? await runPendingAdd(login.accessToken, pendingAdd)
      : undefined;

    const response = ok({
      user: login.user,
      destination,
      ...(pendingAddResult ? { pendingAdd: pendingAddResult } : {}),
    });
    setSessionCookies(response, {
      accessToken: login.accessToken,
      expiresIn: login.expiresIn,
      refreshToken: login.refreshToken,
    });

    // Both cookies are used once, whatever the outcome (D4-08).
    response.cookies.set(COOKIE.next, '', cookieOptions(0));
    response.cookies.set(COOKIE.pendingAdd, '', cookieOptions(0));
    return response;
  } catch (error) {
    return fromAppError(error);
  }
}

/**
 * The "Add to cart" made before logging in (D2-02), run once as a normal cart request against the
 * product, price and stock of this moment. An add whose outcome is unknown is not repeated; the
 * page tells the person instead.
 */
async function runPendingAdd(
  accessToken: string,
  pendingAdd: { variantId: string; quantity: number },
): Promise<AddNotice> {
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
