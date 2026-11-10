import type { NextRequest } from 'next/server';
import * as authApi from '@/server/api-layer/auth';
import { preLoginToken, sessionToken } from '@/server/auth/csrf';
import { fromAppError, fromFailure, ok, setSessionCookies } from '@/server/auth/http';
import { asUser, loginIdOf, readAuth } from '@/server/auth/session';

/**
 * GET /api/session: who is logged in, and the anti-forgery token for this page (Document 4, section 9; D7-13).
 * Refreshes the session when needed; new cookies are set only in the response of the request that refreshed.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = readAuth(request);
  const preLogin = { csrfToken: preLoginToken() };
  if (!auth.access && !auth.refresh) return ok({ user: null, ...preLogin });
  try {
    const result = await asUser(auth, (token) => authApi.getMe(token));
    if (!result.ok) return result.outcome === 'anonymous' ? ok({ user: null, ...preLogin }) : fromFailure(result, preLogin);
    const loginId = result.newCookies?.refresh.l ?? loginIdOf(auth);
    const response = ok({ user: result.value.data, csrfToken: loginId ? sessionToken(loginId) : preLogin.csrfToken });
    if (result.newCookies) setSessionCookies(response, result.newCookies);
    return response;
  } catch (error) {
    return fromAppError(error);
  }
}
