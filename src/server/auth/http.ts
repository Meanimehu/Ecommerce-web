import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';
import { serverConfig } from '../config';
import { COOKIE, cookieOptions, LIFETIME_SECONDS } from './cookies';
import type { Failure, NewCookies } from './session';

/** Helpers for our own endpoints: answers, errors, cookies and the forgery check. */

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

/**
 * A request that could not run as the person (Document 4, section 9). Only when the backend confirmed the session is
 * over are the cookies cleared, in this same answer (D2-05). "Try again" changes no cookie.
 */
export function fromFailure(failure: Failure): NextResponse {
  switch (failure.outcome) {
    case 'anonymous':
      return fail('UNAUTHORIZED', 401);
    case 'temporary':
      return fail('SESSION_TEMPORARY', 503);
    case 'ended': {
      const blocked = failure.reason === 'blocked';
      const response = fail(blocked ? 'USER_BLOCKED' : 'SESSION_ENDED', blocked ? 403 : 401);
      clearSessionCookies(response);
      return response;
    }
  }
}

export function setSessionCookies(response: NextResponse, cookies: NewCookies): void {
  response.cookies.set(COOKIE.access, cookies.accessToken, cookieOptions(cookies.expiresIn));
  response.cookies.set(COOKIE.refresh, cookies.refreshToken, cookieOptions(LIFETIME_SECONDS.refresh));
}

/** Clears the login and temporary-flow cookies; the language cookie stays (Document 4, section 9). */
export function clearSessionCookies(response: NextResponse): void {
  for (const name of [COOKIE.access, COOKIE.refresh, COOKIE.pendingAdd, COOKIE.next]) response.cookies.set(name, '', cookieOptions(0));
}

/**
 * Forgery protection (Document 2, section 6; Document 7, section 17.3, D7-13). Every data-changing request must come
 * from our own site (exact Origin) and carry our fixed header. Another site cannot add that header to a request to us.
 */
export const FORGERY_HEADER = 'x-dhaaga-csrf';

export function guardChange(request: NextRequest): NextResponse | null {
  if (request.headers.get('origin') !== serverConfig.siteOrigin) return fail('ORIGIN_INVALID', 403);
  if (request.headers.get(FORGERY_HEADER) !== '1') return fail('CSRF_INVALID', 403);
  return null;
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
