import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { NextRequest, NextResponse } from 'next/server';
import { AppErrorCode, BackendErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { HttpStatus } from '@/lib/http-status';
import type { Locale } from '@/lib/i18n';
import { adminHomePath, homePath, vendorHomePath } from '@/lib/routes';
import { COOKIE, cookieOptions, deleteCookie, LIFETIME_SECONDS } from '@/middleware/cookies';
import { fail } from '@/middleware/responses';
import { isStaff, VENDOR_OWNER_ROLE, type User } from '@/features/auth/types';
import * as authApi from './auth-api';

/**
 * Who a request is, and keeping them logged in (Document 2, section 4; Document 4, section 9,
 * D4-11). There is no store: this server runs at most one refresh per refresh token at a time, and
 * tabs or servers that refresh at the same moment are covered by the backend, which accepts a
 * just-replaced refresh token again within 10 seconds (area-1-accounts.md, refresh).
 */

export interface AuthCookies {
  access?: string;
  refresh?: string;
}

export function readAuth(request: NextRequest): AuthCookies {
  return {
    access: request.cookies.get(COOKIE.access)?.value || undefined,
    refresh: request.cookies.get(COOKIE.refresh)?.value || undefined,
  };
}

export interface NewCookies {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

/**
 * Why a request could not run as the person: not logged in, a problem on our side ("try again"), or
 * session over.
 */
export enum SessionOutcome {
  Anonymous = 'anonymous',
  Temporary = 'temporary',
  Ended = 'ended',
}

/**
 * Why the backend ended the session: it is over (expired, logged out, reused), or the person is
 * blocked.
 */
export enum EndReason {
  Session = 'session',
  Blocked = 'blocked',
}

export type Failure =
  | { outcome: SessionOutcome.Anonymous }
  | { outcome: SessionOutcome.Temporary }
  | { outcome: SessionOutcome.Ended; reason: EndReason };

export type Refreshed = { ok: true; cookies: NewCookies } | ({ ok: false } & Failure);

/**
 * Backend answers to a refresh that confirm the session is over (area-1-accounts.md, POST
 * /auth/refresh).
 */
const ENDED_CODES: ReadonlySet<string> = new Set([
  BackendErrorCode.SessionEnded,
  BackendErrorCode.TokenReused,
]);

/**
 * Refreshes running on this server, by refresh token, so requests that arrive together share one
 * refresh.
 */
const running = new Map<string, Promise<Refreshed>>();

export function refreshSession(
  refreshToken: string,
  backendRefresh: (
    token: string,
  ) => Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> = async (token) =>
    (await authApi.refreshTokens({ refreshToken: token })).data,
): Promise<Refreshed> {
  const already = running.get(refreshToken);
  if (already) return already;
  const attempt = (async (): Promise<Refreshed> => {
    try {
      const fresh = await backendRefresh(refreshToken);
      return {
        ok: true,
        cookies: {
          accessToken: fresh.accessToken,
          expiresIn: fresh.expiresIn,
          refreshToken: fresh.refreshToken,
        },
      };
    } catch (caughtError) {
      if (caughtError instanceof AppError && ENDED_CODES.has(caughtError.code)) {
        return { ok: false, outcome: SessionOutcome.Ended, reason: EndReason.Session };
      }
      if (caughtError instanceof AppError && caughtError.code === BackendErrorCode.UserBlocked) {
        return { ok: false, outcome: SessionOutcome.Ended, reason: EndReason.Blocked };
      }
      // No clear answer (timeout, network, backend error): nobody is logged out (D2-05).
      return { ok: false, outcome: SessionOutcome.Temporary };
    }
  })().finally(() => running.delete(refreshToken));
  running.set(refreshToken, attempt);
  return attempt;
}

export type AsUser<T> = { ok: true; value: T; newCookies?: NewCookies } | ({ ok: false } & Failure);

/**
 * Runs a backend call with the person's access token. If the token is missing or the backend says
 * it has expired, the session is refreshed once and the call repeated: the backend refused it
 * before doing anything, so repeating is safe. The caller sets `newCookies` in its answer.
 */
export async function asUser<T>(
  auth: AuthCookies,
  call: (token: string) => Promise<T>,
  options: { once?: boolean } = {},
): Promise<AsUser<T>> {
  let token = auth.access;
  let newCookies: NewCookies | undefined;

  const refresh = async (): Promise<Failure | null> => {
    if (!auth.refresh) {
      return token
        ? { outcome: SessionOutcome.Ended, reason: EndReason.Session }
        : { outcome: SessionOutcome.Anonymous };
    }
    const result = await refreshSession(auth.refresh);
    if (!result.ok) return result;
    token = result.cookies.accessToken;
    newCookies = result.cookies;
    return null;
  };

  // A call that can be sent only once (a streamed upload) is never repeated, so it starts with a
  // token that will not
  // expire on the way.
  if (!token || (options.once && expiresWithin(token, 60))) {
    const failure = await refresh();
    if (failure) return { ok: false, ...failure };
  }
  for (;;) {
    try {
      return { ok: true, value: await call(token as string), newCookies };
    } catch (caughtError) {
      if (!(caughtError instanceof AppError)) throw caughtError;
      const expired =
        caughtError.code === BackendErrorCode.TokenExpired ||
        caughtError.code === BackendErrorCode.TokenInvalid;
      if (expired && options.once) return { ok: false, outcome: SessionOutcome.Temporary };
      if (expired && !newCookies) {
        const failure = await refresh();
        if (failure) return { ok: false, ...failure };
        continue;
      }
      if (expired || caughtError.code === BackendErrorCode.SessionEnded) {
        return { ok: false, outcome: SessionOutcome.Ended, reason: EndReason.Session };
      }
      if (caughtError.code === BackendErrorCode.UserBlocked) {
        return { ok: false, outcome: SessionOutcome.Ended, reason: EndReason.Blocked };
      }
      throw caughtError;
    }
  }
}

/**
 * True when the access token's own expiry time is less than `seconds` away. The token is only read,
 * never trusted: the backend checks it. A token that cannot be read counts as expiring.
 */
export function expiresWithin(token: string, seconds: number): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as { exp?: unknown };
    return typeof payload.exp !== 'number' || payload.exp * 1000 - Date.now() < seconds * 1000;
  } catch {
    return true;
  }
}

/**
 * Who is looking at a server-rendered page. A page render cannot set cookies, so it never
 * refreshes: when the access token is missing or expired it answers "needs-refresh", and the page
 * lets the browser call GET /api/session, which refreshes and sets the new cookies (Document 4,
 * section 9).
 */
export enum ViewerState {
  Anonymous = 'anonymous',
  NeedsRefresh = 'needs-refresh',
  User = 'user',
  Unavailable = 'unavailable',
}

export type Viewer =
  | { state: ViewerState.Anonymous }
  | { state: ViewerState.NeedsRefresh }
  | { state: ViewerState.User; user: User; token: string }
  | { state: ViewerState.Unavailable };

/**
 * Asked once per page render, however many layouts and pages ask (React cache). The token is for
 * this server's own backend calls while rendering; it is never put into the page.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  const cookieStore = await cookies();
  const access = cookieStore.get(COOKIE.access)?.value;
  const refresh = cookieStore.get(COOKIE.refresh)?.value;
  if (!access)
    return refresh ? { state: ViewerState.NeedsRefresh } : { state: ViewerState.Anonymous };
  try {
    const { data } = await authApi.getMe(access);
    return { state: ViewerState.User, user: data, token: access };
  } catch (caughtError) {
    const refreshFirst =
      caughtError instanceof AppError &&
      (caughtError.status === HttpStatus.Unauthorized ||
        caughtError.code === BackendErrorCode.UserBlocked);
    return refreshFirst ? { state: ViewerState.NeedsRefresh } : { state: ViewerState.Unavailable };
  }
});

/** Where a person goes after login when they asked for no page (Document 2, D2-03). */
export function defaultDestination(roles: readonly string[], lang: Locale): string {
  if (isStaff(roles)) return adminHomePath(lang);
  if (roles.includes(VENDOR_OWNER_ROLE)) return vendorHomePath(lang);
  return homePath(lang);
}

/**
 * A request that could not run as the person (Document 4, section 9). Only when the backend
 * confirmed the session is over are the cookies cleared, in this same answer (D2-05). "Try again"
 * changes no cookie.
 */
export function fromFailure(failure: Failure): NextResponse {
  switch (failure.outcome) {
    case SessionOutcome.Anonymous:
      return fail(BackendErrorCode.Unauthorized, HttpStatus.Unauthorized);
    case SessionOutcome.Temporary:
      return fail(AppErrorCode.SessionTemporary, HttpStatus.ServiceUnavailable);
    case SessionOutcome.Ended: {
      const response =
        failure.reason === EndReason.Blocked
          ? fail(BackendErrorCode.UserBlocked, HttpStatus.Forbidden)
          : fail(BackendErrorCode.SessionEnded, HttpStatus.Unauthorized);
      clearSessionCookies(response);
      return response;
    }
  }
}

export function setSessionCookies(response: NextResponse, cookies: NewCookies): void {
  response.cookies.set(COOKIE.access, cookies.accessToken, cookieOptions(cookies.expiresIn));
  response.cookies.set(
    COOKIE.refresh,
    cookies.refreshToken,
    cookieOptions(LIFETIME_SECONDS.refresh),
  );
}

/**
 * Ends the session in this answer: the login cookies and the short-lived cookies that go with them;
 * the language cookie stays (Document 4, section 9). `auth` decides which cookies go; deleting them
 * uses the shared tool, so `auth` needs only the cart cookie's name, never cart code.
 */
export function clearSessionCookies(response: NextResponse): void {
  for (const name of [COOKIE.access, COOKIE.refresh, COOKIE.pendingAdd, COOKIE.next])
    deleteCookie(response, name);
}
