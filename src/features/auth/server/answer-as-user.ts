import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import type { CallResult } from '@/api/client';
import { HttpStatus } from '@/lib/http-status';
import { fromAppError, guardChange, ok } from '@/middleware/responses';
import { asUser, fromFailure, readAuth, setSessionCookies } from './session';

/**
 * The shape every one of our endpoints for the browser follows (Document 4, section 3): check the
 * forgery rules for a change, run the backend call as the person (renewing the login once when
 * needed), answer with what the backend answered, and set any renewed login cookies in the same
 * answer. Which roles may do what is the backend's to decide (the person's token carries the
 * roles); the screens only hide what a role cannot use (Document 5, section 4).
 */
const PRIVATE = { 'Cache-Control': 'private, no-store' };

export async function answerAsUser<T>(
  request: NextRequest,
  call: (token: string) => Promise<CallResult<T>>,
  options: { change?: boolean; once?: boolean } = {},
): Promise<NextResponse> {
  if (options.change) {
    const refused = guardChange(request);
    if (refused) return refused;
  }
  try {
    const result = await asUser(readAuth(request), call, { once: options.once });
    if (!result.ok) return fromFailure(result);
    const { data, status } = result.value;
    const response =
      data === null
        ? new NextResponse(null, { status: HttpStatus.NoContent, headers: PRIVATE })
        : ok(data, status);
    if (result.newCookies) setSessionCookies(response, result.newCookies);
    return response;
  } catch (caughtError) {
    return fromAppError(caughtError);
  }
}

/**
 * A private file (a vendor document, a photo not yet approved) streamed from the backend through
 * our server (D3-04: these never go to the browser any other way). Only the headers that describe
 * the file are passed on.
 */
export async function fileAsUser(
  request: NextRequest,
  open: (token: string) => Promise<Response>,
): Promise<NextResponse> {
  try {
    const result = await asUser(readAuth(request), open);
    if (!result.ok) return fromFailure(result);
    const backend = result.value;
    const headers = new Headers({
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    for (const name of ['content-type', 'content-length', 'content-disposition']) {
      const value = backend.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = new NextResponse(backend.body, { status: HttpStatus.Ok, headers });
    if (result.newCookies) setSessionCookies(response, result.newCookies);
    return response;
  } catch (caughtError) {
    return fromAppError(caughtError);
  }
}
