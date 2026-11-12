import 'server-only';
import type { NextRequest } from 'next/server';
import { AppErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { logServerEvent, ServerEvent } from '@/lib/server-log';
import { guardChange, ok } from '@/middleware/responses';
import * as authApi from './auth-api';
import { asUser, clearSessionCookies, readAuth } from './session';

/**
 * Logout and "log out everywhere" (Document 2, section 4). The backend is asked to end the session (its logout needs a
 * valid access token, so the session is refreshed first when needed). The cookies are cleared in this answer whether
 * or not the backend could be reached; a failed backend request is logged without the token.
 */
export async function logoutRoute(request: NextRequest, everywhere: boolean) {
  const refused = guardChange(request);
  if (refused) return refused;
  const auth = readAuth(request);
  if (auth.access || auth.refresh) {
    try {
      const result = await asUser(auth, (token) => (everywhere ? authApi.logoutEverywhere(token) : authApi.logout(token)));
      if (!result.ok && result.outcome === 'temporary') logServerEvent(ServerEvent.LogoutBackendUnconfirmed, { flags: { everywhere } });
    } catch (caughtError) {
      const code = caughtError instanceof AppError ? caughtError.code : AppErrorCode.UnknownError;
      logServerEvent(ServerEvent.LogoutBackendFailed, { code, flags: { everywhere } });
    }
  }
  const response = ok({ loggedOut: true });
  clearSessionCookies(response);
  return response;
}
