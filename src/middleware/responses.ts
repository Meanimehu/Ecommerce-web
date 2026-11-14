import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { serverConfig } from '@/lib/config';
import { AppErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { HttpStatus } from '@/lib/http-status';
import {
  errorTypeOf,
  logErrorDetailsOutsideProduction,
  logServerEvent,
  ServerEvent,
} from '@/lib/server-log';

/** Helpers for our own endpoints: answers, errors and the forgery check. They know nothing about the session. */

/**
 * Responses of our own endpoints: personal, never cached (Document 2, section 5). An error carries a request id only
 * when it is a real one someone can look up: the backend's, or one written to our own log (D5-14; T7-4). Errors our
 * server decides by itself (wrong origin, a malformed request, "try again") carry none.
 */
const PRIVATE = { 'Cache-Control': 'private, no-store' };

export function ok(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: PRIVATE });
}

export function fail(
  code: string,
  status: number,
  extra: Record<string, unknown> = {},
  requestId?: string,
): NextResponse {
  return NextResponse.json(
    { error: { code, ...(requestId ? { requestId } : {}), ...extra } },
    { status, headers: PRIVATE },
  );
}

/** No answer from the backend: it timed out (504) or could not be reached (502). */
const connectionProblemStatus = (error: AppError) =>
  error.code === AppErrorCode.Timeout ? HttpStatus.GatewayTimeout : HttpStatus.BadGateway;

export function fromAppError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    const status = error.status === 0 ? connectionProblemStatus(error) : error.status;
    return fail(
      error.code,
      status,
      {
        details: error.details,
        fields: error.fields,
        backendMessage: error.backendMessage,
        outcomeUnknown: error.outcomeUnknown,
      },
      error.requestId,
    );
  }
  const requestId = randomUUID();
  logServerEvent(ServerEvent.UnexpectedError, {
    requestId,
    code: AppErrorCode.ServerError,
    errorType: errorTypeOf(error),
  });
  logErrorDetailsOutsideProduction(error);
  return fail(AppErrorCode.ServerError, HttpStatus.ServerError, {}, requestId);
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
