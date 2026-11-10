import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';
import { COOKIE, cookieOptions, encodeRefreshCookie, LIFETIME_SECONDS } from './cookies';
import { CSRF_HEADER, originAllowed, verifyCsrf, type CsrfAccept } from './csrf';
import { loginIdOf, readAuth, type Failure, type NewCookies } from './session';

/** Responses of our own endpoints: personal, never cached (Document 2, section 5). Errors carry the request id (T7-4). */
const PRIVATE = { 'Cache-Control': 'private, no-store' };

export function ok(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: PRIVATE });
}

export function fail(code: string, status: number, extra: Record<string, unknown> = {}, requestId: string = randomUUID()): NextResponse {
  return NextResponse.json({ error: { code, requestId, ...extra } }, { status, headers: PRIVATE });
}

export function fromAppError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    const status = error.status === 0 ? (error.code === 'TIMEOUT' ? 504 : 502) : error.status;
    return fail(
      error.code,
      status,
      { details: error.details, fields: error.fields, backendMessage: error.backendMessage, outcomeUnknown: error.outcomeUnknown },
      error.requestId ?? randomUUID(),
    );
  }
  console.error(JSON.stringify({ event: 'unexpected_error', message: error instanceof Error ? error.message : String(error) }));
  return fail('SERVER_ERROR', 500);
}

/** The three session answers of Document 4, section 9, plus "not logged in". None sets or clears a cookie. */
export function fromFailure(failure: Failure, extra: Record<string, unknown> = {}): NextResponse {
  switch (failure.outcome) {
    case 'anonymous':
      return fail('UNAUTHORIZED', 401, extra);
    case 'temporary':
      return fail('SESSION_TEMPORARY', 503, extra);
    case 'stale':
      return fail('SESSION_STALE', 409, { handle: failure.handle, ...extra });
    case 'ended':
      return fail(failure.reason === 'blocked' ? 'USER_BLOCKED' : 'SESSION_ENDED', failure.reason === 'blocked' ? 403 : 401, { handle: failure.handle, ...extra });
  }
}

export function setSessionCookies(response: NextResponse, cookies: NewCookies): void {
  response.cookies.set(COOKIE.access, cookies.accessToken, cookieOptions(cookies.expiresIn));
  response.cookies.set(COOKIE.refresh, encodeRefreshCookie(cookies.refresh), cookieOptions(LIFETIME_SECONDS.refresh));
}

/** Clears the authentication and temporary-flow cookies; the language cookie stays (Document 4, section 9). */
export function clearSessionCookies(response: NextResponse): void {
  for (const name of [COOKIE.access, COOKIE.refresh, COOKIE.pendingAdd, COOKIE.next]) response.cookies.set(name, '', cookieOptions(0));
}

/** Every data-changing request: exact Origin, then the anti-forgery token (Document 2, section 6; D7-13). */
export function guardChange(request: NextRequest, accept: CsrfAccept): NextResponse | null {
  if (!originAllowed(request.headers.get('origin'))) return fail('ORIGIN_INVALID', 403);
  if (!verifyCsrf(request.headers.get(CSRF_HEADER), loginIdOf(readAuth(request)), accept)) return fail('CSRF_INVALID', 403);
  return null;
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
