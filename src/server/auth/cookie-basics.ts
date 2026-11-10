import { deriveKey, sign, unsign } from './crypto';

/**
 * Cookie names, lifetimes and attributes (Document 4, section 9; Document 7, section 17.2). Every cookie is `__Host-`,
 * Secure, HttpOnly, SameSite=Lax, path /, no domain (D4-07). Kept free of server-only imports so the proxy can use it.
 */
export const COOKIE = {
  access: '__Host-dhaaga_at',
  refresh: '__Host-dhaaga_rt',
  pendingAdd: '__Host-dhaaga_pa',
  next: '__Host-dhaaga_next',
  language: '__Host-dhaaga_lang',
} as const;

export const LIFETIME_SECONDS = {
  /** Only the browser cookie's lifetime; the backend alone decides whether the refresh token is valid (D7-12). */
  refresh: 30 * 24 * 3600,
  pendingAdd: 15 * 60,
  next: 15 * 60,
  language: 365 * 24 * 3600,
} as const;

export interface CookieOptions {
  httpOnly: true;
  secure: true;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
}

export const cookieOptions = (maxAge: number): CookieOptions => ({ httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge });

/**
 * Only a path in our own site: starts with one "/", no scheme, no host, no backslashes or control characters.
 * "//evil.com", "/\\evil.com" and "https://evil.com" are all refused (no open redirects).
 */
export function isSafeLocalPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0 || path.length > 512) return false;
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return false;
  try {
    return new URL(path, 'https://dhaaga.invalid').origin === 'https://dhaaga.invalid';
  } catch {
    return false;
  }
}

function signingKey(): Buffer {
  const secret = process.env.COOKIE_SECRET;
  if (!secret || secret.length < 32) throw new Error('COOKIE_SECRET must be set (at least 32 characters).');
  return deriveKey(secret, 'signed-cookies');
}

/** The after-login destination: a path inside our own site, signed, and checked again when used. */
export function encodeNext(path: string): string {
  return sign(signingKey(), { p: path });
}

export function decodeNext(raw: string | undefined): string | null {
  const value = unsign<{ p?: unknown }>(signingKey(), raw);
  return typeof value?.p === 'string' && isSafeLocalPath(value.p) ? value.p : null;
}
