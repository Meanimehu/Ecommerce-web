import 'server-only';
import type { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';
import * as authApi from '../api-layer/auth';
import { serverConfig } from '../config';
import { storePool } from '../store/pool';
import { storeStatus } from '../store/monitor';
import { COOKIE, decodeRefreshCookie, type RefreshCookie } from './cookies';
import { b64url, deriveKey, hmac, randomId } from './crypto';
import { refreshSession, sessionHandle, type RefreshKeys } from './refresh';

/** Who a request is, refreshing when needed (Document 2, section 4; Document 4, section 9). Route handlers only. */
export interface AuthCookies {
  access?: string;
  refresh: RefreshCookie | null;
}

export function readAuth(request: NextRequest): AuthCookies {
  return { access: request.cookies.get(COOKIE.access)?.value || undefined, refresh: decodeRefreshCookie(request.cookies.get(COOKIE.refresh)?.value) };
}

export function refreshKeys(): RefreshKeys {
  const marker = [deriveKey(serverConfig.storeSecret, 'marker')];
  const previous = serverConfig.storeSecretPrevious;
  if (previous) marker.push(deriveKey(previous, 'marker'));
  return { marker, result: deriveKey(serverConfig.storeSecret, 'result'), handle: deriveKey(serverConfig.storeSecret, 'handle') };
}

/** The login id the anti-forgery token is tied to (D7-13). */
export function loginIdOf(auth: AuthCookies): string | null {
  if (auth.refresh) return auth.refresh.l;
  return auth.access ? `access:${b64url(hmac(deriveKey(serverConfig.storeSecret, 'login-id'), auth.access))}` : null;
}

/** Non-secret handle for compare-and-clear (Document 4, section 9). */
export function handleOf(auth: AuthCookies): string | null {
  if (auth.refresh) return sessionHandle(refreshKeys(), auth.refresh.t);
  return auth.access ? b64url(hmac(refreshKeys().handle, `access:${auth.access}`)) : null;
}

const HOLDER = `web-${process.pid}-${randomId()}`;

export interface NewCookies {
  accessToken: string;
  expiresIn: number;
  refresh: RefreshCookie;
}

export type Failure =
  | { outcome: 'anonymous' }
  | { outcome: 'temporary' }
  | { outcome: 'stale'; handle: string | null }
  | { outcome: 'ended'; reason: 'session' | 'blocked'; handle: string | null };

export type AsUser<T> = { ok: true; value: T; newCookies?: NewCookies } | ({ ok: false } & Failure);

async function refreshFor(auth: AuthCookies): Promise<{ token: string; newCookies?: NewCookies } | Failure> {
  if (!auth.refresh) return auth.access ? { outcome: 'ended', reason: 'session', handle: handleOf(auth) } : { outcome: 'anonymous' };
  const db = storePool();
  if (!db) return { outcome: 'temporary' };
  const refresh = auth.refresh;
  const out = await refreshSession(refresh, {
    db,
    storeOk: () => storeStatus().ok,
    backendRefresh: async (token) => (await authApi.refreshTokens({ refreshToken: token })).data,
    keys: refreshKeys(),
    holder: HOLDER,
  });
  switch (out.kind) {
    case 'refreshed':
      return {
        token: out.accessToken,
        newCookies: { accessToken: out.accessToken, expiresIn: out.expiresIn, refresh: { t: out.refreshToken, g: out.generationId, l: refresh.l } },
      };
    case 'reused':
      return { token: out.accessToken };
    case 'temporary':
      return { outcome: 'temporary' };
    case 'stale':
      return { outcome: 'stale', handle: out.handle };
    case 'ended':
      return { outcome: 'ended', reason: out.reason, handle: out.handle };
  }
}

/**
 * Runs a backend call with the person's access token. If the token is missing or the backend says it has expired, the
 * session is refreshed once and the call repeated: the backend refused it before doing anything, so repeating is safe.
 */
export async function asUser<T>(auth: AuthCookies, call: (token: string) => Promise<T>): Promise<AsUser<T>> {
  let token = auth.access;
  let newCookies: NewCookies | undefined;
  let refreshed = false;

  const refresh = async (): Promise<Failure | null> => {
    refreshed = true;
    const got = await refreshFor(auth);
    if ('outcome' in got) return got;
    token = got.token;
    newCookies = got.newCookies;
    return null;
  };

  if (!token) {
    const failure = await refresh();
    if (failure) return { ok: false, ...failure };
  }
  for (;;) {
    try {
      return { ok: true, value: await call(token as string), newCookies };
    } catch (error) {
      if (!(error instanceof AppError)) throw error;
      if ((error.code === 'TOKEN_EXPIRED' || error.code === 'TOKEN_INVALID') && !refreshed) {
        const failure = await refresh();
        if (failure) return { ok: false, ...failure };
        continue;
      }
      if (error.code === 'SESSION_ENDED' || error.code === 'TOKEN_EXPIRED' || error.code === 'TOKEN_INVALID') {
        return { ok: false, outcome: 'ended', reason: 'session', handle: handleOf(auth) };
      }
      if (error.code === 'USER_BLOCKED') return { ok: false, outcome: 'ended', reason: 'blocked', handle: handleOf(auth) };
      throw error;
    }
  }
}
