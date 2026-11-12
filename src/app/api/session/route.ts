import type { NextRequest } from 'next/server';
import { fromAppError, ok } from '@/middleware/responses';
import * as authApi from '@/features/auth/server/auth-api';
import { asUser, fromFailure, readAuth, setSessionCookies } from '@/features/auth/server/session';

/**
 * GET /api/session: who is logged in (Document 4, section 9). Refreshes the session when needed and sets the new
 * cookies in this answer; clears them only when the backend confirms the session is over.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = readAuth(request);
  if (!auth.access && !auth.refresh) return ok({ user: null });
  try {
    const result = await asUser(auth, (token) => authApi.getMe(token));
    if (!result.ok) return result.outcome === 'anonymous' ? ok({ user: null }) : fromFailure(result);
    const response = ok({ user: result.value.data });
    if (result.newCookies) setSessionCookies(response, result.newCookies);
    return response;
  } catch (error) {
    return fromAppError(error);
  }
}
