import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import type { CallResult, UploadBody } from '@/api/client';
import { fail, fromAppError, readJson } from './responses';

/**
 * A public read (the storefront catalogue): no login, the same answer for everyone, so it may be kept for a while by
 * the browser (Document 4, section 7; Document 7, section 12 freshness). It never sets a cookie (Document 2, section 5).
 */
export async function answerPublic<T>(
  call: () => Promise<CallResult<T>>,
  maxAgeSeconds: number,
): Promise<NextResponse> {
  try {
    const { data, status } = await call();
    return NextResponse.json(data, {
      status,
      headers: { 'Cache-Control': `public, max-age=${maxAgeSeconds}` },
    });
  } catch (error) {
    return fromAppError(error);
  }
}

/** A JSON object body, or null for anything else. The backend checks the fields (it refuses unknown ones). */
export async function jsonObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  const body = await readJson(request);
  return body !== null && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : null;
}

/**
 * A file upload from the browser, passed on as it arrives (Document 3, section 10). One multipart body; anything larger
 * than the biggest file the backend takes for this endpoint (plus room for the form fields) is refused before it is read.
 */
export function uploadFrom(request: NextRequest, maxFileBytes: number): UploadBody | NextResponse {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data') || !request.body)
    return fail('FILE_REQUIRED', 400);
  const length = request.headers.get('content-length') ?? undefined;
  if (length !== undefined && Number(length) > maxFileBytes + 64 * 1024)
    return fail('FILE_TOO_LARGE', 413);
  return { stream: request.body, contentType, contentLength: length };
}
