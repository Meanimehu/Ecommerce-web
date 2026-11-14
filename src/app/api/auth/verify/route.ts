import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';
import { fail, fromAppError, guardChange, ok, readJson } from '@/middleware/responses';
import { forgetPageAfterLogin, readPageAfterLogin } from '@/features/auth/after-login-page';
import * as authApi from '@/features/auth/server/auth-api';
import { defaultDestination, setSessionCookies } from '@/features/auth/server/session';
import { forgetPendingAdd, runPendingAdd } from '@/features/cart/server/pending-add';

/**
 * POST /api/auth/verify: checks the code with the backend and, when it is right, sets the login
 * cookies (D2-01). The answer says where to go next: the page the person asked for, else the
 * default for their role (D2-03). An "Add to cart" made before logging in runs here once, through
 * `cart` (D2-02); the answer says what happened to it.
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

    const askedForPage = readPageAfterLogin(request);
    const destination = askedForPage ?? defaultDestination(login.user.roles, lang);

    const pendingAddResult = await runPendingAdd(request, login.accessToken);

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
    forgetPageAfterLogin(response);
    forgetPendingAdd(response);
    return response;
  } catch (error) {
    return fromAppError(error);
  }
}
