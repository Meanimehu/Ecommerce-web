import 'server-only';
export { COOKIE, LIFETIME_SECONDS, cookieOptions, isSafeLocalPath, encodeNext, decodeNext, type CookieOptions } from './cookie-basics';

/**
 * The cookies of Document 4, section 9 and Document 7, section 17.2. Every one is `__Host-`, Secure, HttpOnly,
 * SameSite=Lax, path /, no domain (D4-07). Only the frontend server reads them.
 */
/** What the refresh cookie holds: the refresh token, the store generation it was issued under, and the login id. */
export interface RefreshCookie {
  /** Refresh token (never logged, never stored in the shared store). */
  t: string;
  /** Store generation id when the token was stored (Document 4, section 9, "Store generation"). */
  g: string;
  /** Random id for this login, kept through refreshes; the anti-forgery token is tied to it (D7-13). */
  l: string;
}

export function encodeRefreshCookie(value: RefreshCookie): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function decodeRefreshCookie(raw: string | undefined): RefreshCookie | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Partial<RefreshCookie>;
    return typeof value.t === 'string' && typeof value.g === 'string' && typeof value.l === 'string' ? (value as RefreshCookie) : null;
  } catch {
    return null;
  }
}
