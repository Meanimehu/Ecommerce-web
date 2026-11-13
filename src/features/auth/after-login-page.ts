import type { NextRequest, NextResponse } from 'next/server';
import {
  COOKIE,
  cookieOptions,
  deleteCookie,
  isSafeLocalPath,
  LIFETIME_SECONDS,
  sign,
  unsign,
} from '@/middleware/cookies';

/**
 * The page to return to after login (Document 2, D2-03; Document 4, section 9): a path inside our
 * own site, kept signed in a short-lived cookie and checked again when it is read. No server-only
 * import, so `proxy.ts` can use it.
 */
export function rememberPageAfterLogin(response: NextResponse, path: string): void {
  if (!isSafeLocalPath(path)) return;
  response.cookies.set(COOKIE.next, sign({ p: path }), cookieOptions(LIFETIME_SECONDS.next));
}

/** The remembered page, or null when the cookie is missing, altered or not a path in our site. */
export function readPageAfterLogin(request: NextRequest): string | null {
  const stored = unsign<{ p?: unknown }>(request.cookies.get(COOKIE.next)?.value);
  return typeof stored?.p === 'string' && isSafeLocalPath(stored.p) ? stored.p : null;
}

/** The cookie is used once, whatever the outcome of the login (D4-08). */
export function forgetPageAfterLogin(response: NextResponse): void {
  deleteCookie(response, COOKIE.next);
}
