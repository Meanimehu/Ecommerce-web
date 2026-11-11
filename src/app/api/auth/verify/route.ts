import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { isLocale } from '@/lib/i18n';
import * as authApi from '@/server/api-layer/accounts';
import { COOKIE, cookieOptions, decodeNext } from '@/server/auth/cookies';
import { randomId } from '@/server/auth/crypto';
import { sessionToken } from '@/server/auth/csrf';
import { defaultDestination } from '@/server/auth/destination';
import { fail, fromAppError, guardChange, ok, readJson, setSessionCookies } from '@/server/auth/http';
import { storeStatus } from '@/server/store/monitor';

/**
 * POST /api/auth/verify: checks the code with the backend and, on success, sets the login cookies (Document 2,
 * D2-01). The person then goes to the page they asked for, else the default for their role (D2-03).
 */
const Body = z.object({ phone: z.string().trim().min(1).max(20), code: z.string().trim().min(1).max(12), lang: z.string() });

export async function POST(request: NextRequest) {
  const refused = guardChange(request, 'session-or-pre-login');
  if (refused) return refused;
  const body = Body.safeParse(await readJson(request));
  if (!body.success) return fail('VALIDATION_FAILED', 400);
  const lang = isLocale(body.data.lang) ? body.data.lang : 'en';
  try {
    const { data } = await authApi.verifyLoginCode({ phone: body.data.phone, code: body.data.code });
    const loginId = randomId();
    // A cookie stamped with "none" (store generation unknown at login) can never refresh; the person logs in again.
    const generation = storeStatus().generationId ?? 'none';
    const asked = decodeNext(request.cookies.get(COOKIE.next)?.value);
    const destination = asked ?? defaultDestination(data.user.roles, lang);
    const response = ok({ user: data.user, destination, csrfToken: sessionToken(loginId) });
    setSessionCookies(response, { accessToken: data.accessToken, expiresIn: data.expiresIn, refresh: { t: data.refreshToken, g: generation, l: loginId } });
    response.cookies.set(COOKIE.next, '', cookieOptions(0));
    response.cookies.set(COOKIE.pendingAdd, '', cookieOptions(0));
    return response;
  } catch (error) {
    return fromAppError(error);
  }
}
