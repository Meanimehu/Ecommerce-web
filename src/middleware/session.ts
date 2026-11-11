import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { isStaff, type User } from '@/types/auth';
import * as authApi from '@/api/auth';
import { COOKIE } from './cookies';
import { clearSessionCookies, guardChange, ok } from './responses';

/**
 * Who a request is, and keeping them logged in (Document 2, section 4; Document 4, section 9, D4-11).
 * There is no store: this server runs at most one refresh per refresh token at a time, and tabs or servers that
 * refresh at the same moment are covered by the backend, which accepts a just-replaced refresh token again within
 * 10 seconds (area-1-accounts.md, refresh).
 */

export interface AuthCookies {
  access?: string;
  refresh?: string;
}

export function readAuth(request: NextRequest): AuthCookies {
  return { access: request.cookies.get(COOKIE.access)?.value || undefined, refresh: request.cookies.get(COOKIE.refresh)?.value || undefined };
}

export interface NewCookies {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

/** Why a request could not run as the person: not logged in, a problem on our side ("try again"), or session over. */
export type Failure = { outcome: 'anonymous' } | { outcome: 'temporary' } | { outcome: 'ended'; reason: 'session' | 'blocked' };

export type Refreshed = { ok: true; cookies: NewCookies } | ({ ok: false } & Failure);

/** Backend answers to a refresh that confirm the session is over (area-1-accounts.md, POST /auth/refresh). */
const ENDED_CODES = new Set(['SESSION_ENDED', 'TOKEN_REUSED']);

/** Refreshes running on this server, by refresh token, so requests that arrive together share one refresh. */
const running = new Map<string, Promise<Refreshed>>();

export function refreshSession(
  refreshToken: string,
  backendRefresh: (token: string) => Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> = async (token) =>
    (await authApi.refreshTokens({ refreshToken: token })).data,
): Promise<Refreshed> {
  const already = running.get(refreshToken);
  if (already) return already;
  const attempt = (async (): Promise<Refreshed> => {
    try {
      const fresh = await backendRefresh(refreshToken);
      return { ok: true, cookies: { accessToken: fresh.accessToken, expiresIn: fresh.expiresIn, refreshToken: fresh.refreshToken } };
    } catch (error) {
      if (error instanceof AppError && ENDED_CODES.has(error.code)) return { ok: false, outcome: 'ended', reason: 'session' };
      if (error instanceof AppError && error.code === 'USER_BLOCKED') return { ok: false, outcome: 'ended', reason: 'blocked' };
      // No clear answer (timeout, network, backend error): nobody is logged out (D2-05).
      return { ok: false, outcome: 'temporary' };
    }
  })().finally(() => running.delete(refreshToken));
  running.set(refreshToken, attempt);
  return attempt;
}

export type AsUser<T> = { ok: true; value: T; newCookies?: NewCookies } | ({ ok: false } & Failure);

/**
 * Runs a backend call with the person's access token. If the token is missing or the backend says it has expired, the
 * session is refreshed once and the call repeated: the backend refused it before doing anything, so repeating is safe.
 * The caller sets `newCookies` in its answer.
 */
export async function asUser<T>(auth: AuthCookies, call: (token: string) => Promise<T>, options: { once?: boolean } = {}): Promise<AsUser<T>> {
  let token = auth.access;
  let newCookies: NewCookies | undefined;

  const refresh = async (): Promise<Failure | null> => {
    if (!auth.refresh) return token ? { outcome: 'ended', reason: 'session' } : { outcome: 'anonymous' };
    const result = await refreshSession(auth.refresh);
    if (!result.ok) return result;
    token = result.cookies.accessToken;
    newCookies = result.cookies;
    return null;
  };

  // A call that can be sent only once (a streamed upload) is never repeated, so it starts with a token that will not
  // expire on the way.
  if (!token || (options.once && expiresWithin(token, 60))) {
    const failure = await refresh();
    if (failure) return { ok: false, ...failure };
  }
  for (;;) {
    try {
      return { ok: true, value: await call(token as string), newCookies };
    } catch (error) {
      if (!(error instanceof AppError)) throw error;
      const expired = error.code === 'TOKEN_EXPIRED' || error.code === 'TOKEN_INVALID';
      if (expired && options.once) return { ok: false, outcome: 'temporary' };
      if (expired && !newCookies) {
        const failure = await refresh();
        if (failure) return { ok: false, ...failure };
        continue;
      }
      if (expired || error.code === 'SESSION_ENDED') return { ok: false, outcome: 'ended', reason: 'session' };
      if (error.code === 'USER_BLOCKED') return { ok: false, outcome: 'ended', reason: 'blocked' };
      throw error;
    }
  }
}

/**
 * True when the access token's own expiry time is less than `seconds` away. The token is only read, never trusted:
 * the backend checks it. A token that cannot be read counts as expiring.
 */
export function expiresWithin(token: string, seconds: number): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as { exp?: unknown };
    return typeof payload.exp !== 'number' || payload.exp * 1000 - Date.now() < seconds * 1000;
  } catch {
    return true;
  }
}

/**
 * Who is looking at a server-rendered page. A page render cannot set cookies, so it never refreshes: when the access
 * token is missing or expired it answers "needs-refresh", and the page lets the browser call GET /api/session, which
 * refreshes and sets the new cookies (Document 4, section 9).
 */
export type Viewer = { state: 'anonymous' } | { state: 'needs-refresh' } | { state: 'user'; user: User; token: string } | { state: 'unavailable' };

/**
 * Asked once per page render, however many layouts and pages ask (React cache). The token is for this server's own
 * backend calls while rendering; it is never put into the page.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  const jar = await cookies();
  const access = jar.get(COOKIE.access)?.value;
  const refresh = jar.get(COOKIE.refresh)?.value;
  if (!access) return refresh ? { state: 'needs-refresh' } : { state: 'anonymous' };
  try {
    const { data } = await authApi.getMe(access);
    return { state: 'user', user: data, token: access };
  } catch (error) {
    if (error instanceof AppError && (error.status === 401 || error.code === 'USER_BLOCKED')) return { state: 'needs-refresh' };
    return { state: 'unavailable' };
  }
});

/** Where a person goes after login when they asked for no page (Document 2, D2-03). */
export function defaultDestination(roles: readonly string[], lang: Locale): string {
  if (isStaff(roles)) return `/${lang}/admin`;
  if (roles.includes('vendor_owner')) return `/${lang}/vendor`;
  return `/${lang}`;
}

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
      if (!result.ok && result.outcome === 'temporary') console.warn(JSON.stringify({ event: 'logout_backend_unconfirmed', everywhere }));
    } catch (error) {
      console.warn(JSON.stringify({ event: 'logout_backend_failed', code: error instanceof AppError ? error.code : 'unknown', everywhere }));
    }
  }
  const response = ok({ loggedOut: true });
  clearSessionCookies(response);
  return response;
}
