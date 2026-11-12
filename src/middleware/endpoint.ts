import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import type { CallResult, UploadBody } from '@/api/client';
import { fail, fromAppError, fromFailure, guardChange, ok, readJson, setSessionCookies } from './responses';
import { asUser, readAuth } from './session';

/**
 * The shape every one of our endpoints for the browser follows (Document 4, section 3): check the forgery rules for a
 * change, run the backend call as the person (renewing the login once when needed), answer with what the backend
 * answered, and set any renewed login cookies in the same answer. Which roles may do what is the backend's to decide
 * (the person's token carries the roles); the screens only hide what a role cannot use (Document 5, section 4).
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
    const response = data === null ? new NextResponse(null, { status: 204, headers: PRIVATE }) : ok(data, status);
    if (result.newCookies) setSessionCookies(response, result.newCookies);
    return response;
  } catch (error) {
    return fromAppError(error);
  }
}

/** A JSON object body, or null for anything else. The backend checks the fields (it refuses unknown ones). */
export async function jsonObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  const body = await readJson(request);
  return body !== null && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
}

/**
 * A file upload from the browser, passed on as it arrives (Document 3, section 10). One multipart body; anything larger
 * than the biggest file the backend takes for this endpoint (plus room for the form fields) is refused before it is read.
 */
export function uploadFrom(request: NextRequest, maxFileBytes: number): UploadBody | NextResponse {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data') || !request.body) return fail('FILE_REQUIRED', 400);
  const length = request.headers.get('content-length') ?? undefined;
  if (length !== undefined && Number(length) > maxFileBytes + 64 * 1024) return fail('FILE_TOO_LARGE', 413);
  return { stream: request.body, contentType, contentLength: length };
}

/**
 * A private file (a vendor document, a photo not yet approved) streamed from the backend through our server (D3-04:
 * these never go to the browser any other way). Only the headers that describe the file are passed on.
 */
export async function fileAsUser(request: NextRequest, open: (token: string) => Promise<Response>): Promise<NextResponse> {
  try {
    const result = await asUser(readAuth(request), open);
    if (!result.ok) return fromFailure(result);
    const backend = result.value;
    const headers = new Headers({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    for (const name of ['content-type', 'content-length', 'content-disposition']) {
      const value = backend.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = new NextResponse(backend.body, { status: 200, headers });
    if (result.newCookies) setSessionCookies(response, result.newCookies);
    return response;
  } catch (error) {
    return fromAppError(error);
  }
}
