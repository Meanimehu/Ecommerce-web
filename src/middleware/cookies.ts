import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';
import type { NextResponse } from 'next/server';

/**
 * Our cookies (Document 4, section 9; Document 7, section 17.2). Every one is `__Host-`, Secure, HttpOnly,
 * SameSite=Lax, path /, no domain (D4-07). Only the frontend server reads them. Kept free of server-only imports so
 * the proxy can use it too.
 */
export const COOKIE = {
  access: '__Host-dhaaga_at',
  /** Holds the backend's refresh token as it is (it is already safe to put in a cookie). */
  refresh: '__Host-dhaaga_rt',
  pendingAdd: '__Host-dhaaga_pa',
  next: '__Host-dhaaga_next',
  language: '__Host-dhaaga_lang',
} as const;

export type CookieName = (typeof COOKIE)[keyof typeof COOKIE];

export const LIFETIME_SECONDS = {
  /** Only the browser cookie's lifetime; the backend alone decides whether the refresh token is valid (D7-12). */
  refresh: 30 * 24 * 3600,
  pendingAdd: 15 * 60,
  next: 15 * 60,
  language: 365 * 24 * 3600,
} as const;

export const cookieOptions = (maxAge: number) =>
  ({ httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge }) as const;

/**
 * Deletes one of our cookies in this answer. Which cookies go, and when, is the rule of the feature that owns them
 * (Document 7, section 20.4); this is only the tool.
 */
export function deleteCookie(response: NextResponse, name: CookieName): void {
  response.cookies.set(name, '', cookieOptions(0));
}

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

// Signing the short-lived cookies (pending add, after-login page) with COOKIE_SECRET, so they cannot be altered (D4-07).

function signingKey(): Buffer {
  const secret = process.env.COOKIE_SECRET;
  if (!secret || secret.length < 32)
    throw new Error('COOKIE_SECRET must be set (at least 32 characters).');
  return Buffer.from(hkdfSync('sha256', secret, 'dhaaga-web', 'signed-cookies', 32));
}

const signature = (body: string): string =>
  createHmac('sha256', signingKey()).update(body).digest('base64url');

/** "payload.signature", both base64url. */
export function sign(payload: unknown): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${signature(body)}`;
}

export function unsign<T>(value: string | undefined): T | null {
  if (!value) return null;
  const [body, given, extra] = value.split('.');
  if (!body || !given || extra !== undefined) return null;
  const expected = Buffer.from(signature(body));
  const actual = Buffer.from(given);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

/** The request header in which proxy.ts gives a page render its own address (path and query). */
export const PATH_HEADER = 'x-dhaaga-path';
