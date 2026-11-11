import 'server-only';
import type { NextRequest } from 'next/server';
import * as authApi from '../api-layer/accounts';
import { guardChange, ok } from './http';
import { asUser, handleOf, readAuth } from './session';

/**
 * Logout and "log out everywhere" (Document 2, section 4). The backend is asked to end the session (its logout needs a
 * valid access token, so the session is refreshed first when needed). The answer never changes a cookie: the screen
 * then calls compare-and-clear with the handle, which clears the cookies even if the backend could not be reached.
 */
export async function logoutRoute(request: NextRequest, everywhere: boolean) {
  const refused = guardChange(request, 'session');
  if (refused) return refused;
  const auth = readAuth(request);
  const handle = handleOf(auth);
  try {
    const result = await asUser(auth, (token) => (everywhere ? authApi.logoutEverywhere(token) : authApi.logout(token)));
    if (!result.ok && result.outcome !== 'ended' && result.outcome !== 'anonymous') {
      console.warn(JSON.stringify({ event: 'logout_backend_unconfirmed', outcome: result.outcome, everywhere }));
    }
  } catch (error) {
    console.warn(JSON.stringify({ event: 'logout_backend_failed', code: error instanceof Error ? error.message : 'unknown', everywhere }));
  }
  return ok({ handle });
}
