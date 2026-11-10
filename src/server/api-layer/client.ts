import 'server-only';
import type { z } from 'zod';
import { AppError } from '@/lib/errors';
import { BackendErrorSchema } from '@/schemas/error';
import { serverConfig } from '../config';

/**
 * The one place that talks to the backend (Document 3, section 3). Request-specific timeouts, automatic retries for
 * safe reads only, never for saves (D7-01, D7-10). Responses are checked against Zod schemas: strict in development and
 * tests, and in production a mismatch is reported (endpoint, request id, fields; never the data) and the call fails
 * rather than passing invalid data on (D3-02).
 */
export type CallKind = 'view' | 'save' | 'upload' | 'loginCode' | 'refresh';

/** Document 7, section 12 (provisional starting figures). */
export const TIMEOUT_MS: Record<CallKind, number> = { view: 8000, save: 10000, upload: 60000, loginCode: 10000, refresh: 8000 };
const RETRY_PAUSES_MS = [500, 1500];
const MAX_RATE_LIMIT_WAIT_MS = 5000;

export interface CallOptions<S extends z.ZodType | null> {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Path under the backend's /api/v1, for example "/auth/otp/request". */
  path: string;
  kind: CallKind;
  token?: string;
  body?: unknown;
  /** Zod schema of a successful body; null when the backend answers with no body (204). */
  schema: S;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export interface CallResult<T> {
  data: T;
  status: number;
  requestId?: string;
}

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const jitter = (ms: number): number => Math.round(ms * (0.75 + Math.random() * 0.5));

function retryWaitMs(error: AppError, attempt: number): number | null {
  if (attempt >= RETRY_PAUSES_MS.length) return null;
  if (error.status === 429) {
    const seconds = Number(error.details?.retryAfterSeconds);
    const wait = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : (RETRY_PAUSES_MS[attempt] ?? 0);
    return wait <= MAX_RATE_LIMIT_WAIT_MS ? wait : null;
  }
  const retryable = error.code === 'NETWORK' || error.code === 'TIMEOUT' || error.status === 502 || error.status === 503 || error.status === 504 || error.status === 500;
  return retryable ? jitter(RETRY_PAUSES_MS[attempt] ?? 0) : null;
}

export async function callBackend<S extends z.ZodType | null>(options: CallOptions<S>): Promise<CallResult<S extends z.ZodType ? z.infer<S> : null>> {
  const sleep = options.sleep ?? defaultSleep;
  const safeRead = options.method === 'GET';
  for (let attempt = 0; ; attempt++) {
    try {
      return await callOnce(options);
    } catch (error) {
      if (!(error instanceof AppError) || !safeRead) throw error;
      const wait = retryWaitMs(error, attempt);
      if (wait === null) throw error;
      await sleep(wait);
    }
  }
}

async function callOnce<S extends z.ZodType | null>(options: CallOptions<S>): Promise<CallResult<S extends z.ZodType ? z.infer<S> : null>> {
  const doFetch = options.fetchImpl ?? fetch;
  const changesData = options.method !== 'GET';
  const url = `${serverConfig.backendUrl}/api/v1${options.path}`;
  const headers: Record<string, string> = { accept: 'application/json' };
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers['content-type'] = 'application/json';

  let response: Response;
  try {
    response = await doFetch(url, {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(TIMEOUT_MS[options.kind]),
      cache: 'no-store',
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new AppError({ code: timedOut ? 'TIMEOUT' : 'NETWORK', status: 0, outcomeUnknown: changesData });
  }

  const requestId = response.headers.get('x-request-id') ?? undefined;
  const text = await response.text().catch(() => '');
  const json = text ? safeJson(text) : undefined;

  if (!response.ok) {
    const parsed = BackendErrorSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError({ code: response.status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR', status: response.status, requestId, outcomeUnknown: changesData && response.status >= 500 });
    }
    const { code, details } = parsed.data.error;
    // Backend gap B1: details may carry a database constraint name. It is never used or passed on.
    const cleanDetails = details ? Object.fromEntries(Object.entries(details).filter(([k]) => k !== 'constraint')) : undefined;
    throw new AppError({
      code,
      status: response.status,
      requestId: parsed.data.error.requestId ?? requestId,
      details: cleanDetails,
      outcomeUnknown: changesData && response.status >= 500,
    });
  }

  if (options.schema === null) return { data: null as never, status: response.status, requestId };
  const checked = options.schema.safeParse(json);
  if (!checked.success) {
    const fields = checked.error.issues.map((issue) => issue.path.join('.') || '(body)');
    console.error(JSON.stringify({ event: 'response_mismatch', endpoint: `${options.method} ${options.path}`, requestId, fields }));
    throw new AppError({ code: 'RESPONSE_MISMATCH', status: 502, requestId });
  }
  return { data: checked.data as never, status: response.status, requestId };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
