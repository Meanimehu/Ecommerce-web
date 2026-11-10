import 'server-only';
import { serverConfig } from '../config';
import { b64url, deriveKey, hmac, safeEqual, sign, unsign } from './crypto';

/**
 * Anti-forgery tokens (Document 2, section 6; Document 4, D4-07; Document 7, D7-13). Not a cookie: the browser gets
 * the token from GET /api/session, keeps it in memory and sends it in the X-Dhaaga-CSRF header.
 *   - Logged in: tied to the login id in the refresh cookie (stable through refreshes).
 *   - Before login: short-lived and signed; accepted only by the login endpoints, always with the origin check.
 */
export const CSRF_HEADER = 'x-dhaaga-csrf';
const PRE_LOGIN_SECONDS = 15 * 60;

const key = (): Buffer => deriveKey(serverConfig.csrfSecret, 'csrf');

export function sessionToken(loginId: string): string {
  return `s.${b64url(hmac(key(), `session:${loginId}`))}`;
}

export function preLoginToken(now = Date.now()): string {
  return `p.${sign(key(), { k: 'pre-login', exp: Math.floor(now / 1000) + PRE_LOGIN_SECONDS })}`;
}

export type CsrfAccept = 'session' | 'session-or-pre-login';

export function verifyCsrf(token: string | null, loginId: string | null, accept: CsrfAccept, now = Date.now()): boolean {
  if (!token) return false;
  if (token.startsWith('s.')) return loginId !== null && safeEqual(token, sessionToken(loginId));
  if (accept === 'session-or-pre-login' && token.startsWith('p.')) {
    const value = unsign<{ k?: string; exp?: number }>(key(), token.slice(2));
    return value?.k === 'pre-login' && typeof value.exp === 'number' && value.exp * 1000 > now;
  }
  return false;
}

/** The request's Origin must be exactly our site (Document 2, section 6). A missing Origin is refused. */
export function originAllowed(origin: string | null): boolean {
  return origin !== null && origin === serverConfig.siteOrigin;
}
