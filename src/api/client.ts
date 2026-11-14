import 'server-only';
import type { z } from 'zod';
import { AppError } from '@/lib/errors';
import { headers } from 'next/headers';
import { isIP } from 'node:net';
import { BackendErrorSchema } from '@/types/error';
import { serverConfig } from '@/lib/config';
import { withQuery, type Query } from '@/utils/url';
import { logServerEvent, ServerEvent } from '@/lib/server-log';
import { BACKEND_CALLS, type BackendCall } from '@/types/generated/backend-calls';

/**
 * The one place that talks to the backend (Document 3, section 3). Request-specific timeouts, automatic retries for
 * safe reads only, never for saves (D7-01, D7-10). Responses are checked against Zod schemas: strict in development and
 * tests, and in production a mismatch is reported (endpoint, request id, fields; never the data) and the call fails
 * rather than passing invalid data on (D3-02).
 */
export type CallKind = 'view' | 'save' | 'upload' | 'loginCode' | 'refresh';

/** Document 7, section 12 (provisional starting figures). */
export const TIMEOUT_MS: Record<CallKind, number> = {
  view: 8000,
  save: 10000,
  upload: 60000,
  loginCode: 10000,
  refresh: 8000,
};
const RETRY_PAUSES_MS = [500, 1500];
const MAX_RATE_LIMIT_WAIT_MS = 5000;

export interface CallOptions<S extends z.ZodType | null> {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Path under the backend's /api/v1, for example "/auth/otp/request". */
  path: string;
  /** Query values for a read; empty values are left out. */
  query?: Query;
  kind: CallKind;
  token?: string;
  body?: unknown;
  /** A file upload passed on as it arrives, never held whole in memory (Document 3, section 10). Sent once only. */
  upload?: UploadBody;
  /** Zod schema of a successful body; null when the backend answers with no body (204). */
  schema: S;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  /** For tests only; normally read from the incoming request. null sends none. */
  clientAddress?: string | null;
}

/**
 * The customer's address, so the backend's per-address limits count each customer, not this server (Document 3,
 * section 3; Document 4, section 4). Taken only from the header the hosting's front door adds (CLIENT_ADDRESS_HEADER):
 * its last entry, and only if it is a real IP address. What the browser itself sends earlier in the header is ignored.
 */
export function pickClientAddress(headerValue: string | null | undefined): string | undefined {
  const last = (headerValue ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);
  return last && isIP(last) ? last : undefined;
}

async function clientAddress(): Promise<string | undefined> {
  const name = serverConfig.clientAddressHeader;
  if (!name) return undefined;
  try {
    return pickClientAddress((await headers()).get(name));
  } catch {
    // Outside a request (for example a build step): nothing to pass on.
    return undefined;
  }
}

export interface UploadBody {
  stream: ReadableStream<Uint8Array>;
  /** The browser's own multipart/form-data header, with its boundary. */
  contentType: string;
  contentLength?: string;
}

export interface CallResult<T> {
  data: T;
  status: number;
  requestId?: string;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
const jitter = (ms: number): number => Math.round(ms * (0.75 + Math.random() * 0.5));

function retryWaitMs(error: AppError, attempt: number): number | null {
  if (attempt >= RETRY_PAUSES_MS.length) return null;
  if (error.status === 429) {
    const seconds = Number(error.details?.retryAfterSeconds);
    const wait =
      Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : (RETRY_PAUSES_MS[attempt] ?? 0);
    return wait <= MAX_RATE_LIMIT_WAIT_MS ? wait : null;
  }
  // A response that does not match its schema is not a server failure: repeating the call would not change it.
  if (error.code === 'RESPONSE_MISMATCH') return null;
  const retryable =
    error.code === 'NETWORK' ||
    error.code === 'TIMEOUT' ||
    error.status === 502 ||
    error.status === 503 ||
    error.status === 504 ||
    error.status === 500;
  return retryable ? jitter(RETRY_PAUSES_MS[attempt] ?? 0) : null;
}

export async function callBackend<S extends z.ZodType | null>(
  options: CallOptions<S>,
): Promise<CallResult<S extends z.ZodType ? z.infer<S> : null>> {
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

async function callOnce<S extends z.ZodType | null>(
  options: CallOptions<S>,
): Promise<CallResult<S extends z.ZodType ? z.infer<S> : null>> {
  const changesData = options.method !== 'GET';
  const response = await send(options, changesData);
  const requestId = response.headers.get('x-request-id') ?? undefined;
  const text = await response.text().catch(() => '');
  const json = text ? safeJson(text) : undefined;
  if (!response.ok) throw errorFrom(response, json, changesData);

  if (options.schema === null) return { data: null as never, status: response.status, requestId };
  const checked = options.schema.safeParse(json);
  if (!checked.success) {
    // The report: the call's listed name, request id and fields, never the data or the real address (Document 3,
    // section 4; Document 7, section 20.10). Error monitoring is open (Q7-2), so the server log is where it goes for now.
    // In development and tests the screen also says exactly what is wrong.
    const fields = checked.error.issues.map((issue) => issue.path.join('.') || '(body)');
    const endpoint = `${options.method} ${options.path}`;
    logServerEvent(ServerEvent.ResponseMismatch, {
      requestId,
      call: backendCallName(options.method, options.path),
      fields,
    });
    throw new AppError({
      code: 'RESPONSE_MISMATCH',
      status: 502,
      requestId,
      backendMessage: serverConfig.isProduction
        ? undefined
        : `The answer of ${endpoint} does not match its schema (fields: ${fields.join(', ')}).`,
    });
  }
  return { data: checked.data as never, status: response.status, requestId };
}

/** A JSON body, or none. */
const jsonBody = (body: unknown) => (body === undefined ? undefined : JSON.stringify(body));

async function send(
  options: CallOptions<z.ZodType | null>,
  changesData: boolean,
): Promise<Response> {
  const doFetch = options.fetchImpl ?? fetch;
  const url = `${serverConfig.backendUrl}/api/v1${withQuery(options.path, options.query)}`;
  const headers: Record<string, string> = { accept: 'application/json' };
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.upload) {
    headers['content-type'] = options.upload.contentType;
    if (options.upload.contentLength) headers['content-length'] = options.upload.contentLength;
  }
  // The customer's address, so the backend's per-address limits count each customer (Document 3, section 3).
  const address =
    options.clientAddress === undefined ? await clientAddress() : options.clientAddress;
  if (address) headers['x-forwarded-for'] = address;
  try {
    return await doFetch(url, {
      method: options.method,
      headers,
      body: options.upload ? options.upload.stream : jsonBody(options.body),
      signal: AbortSignal.timeout(TIMEOUT_MS[options.kind]),
      cache: 'no-store',
      // A streamed request body (Node.js needs this to send a stream).
      ...(options.upload ? { duplex: 'half' } : {}),
    } as RequestInit);
  } catch (error) {
    const timedOut =
      error instanceof DOMException &&
      (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new AppError({
      code: timedOut ? 'TIMEOUT' : 'NETWORK',
      status: 0,
      outcomeUnknown: changesData,
    });
  }
}

/** One AppError from a backend error answer (api-contract.md, section 3). */
function errorFrom(response: Response, json: unknown, changesData: boolean): AppError {
  const requestId = response.headers.get('x-request-id') ?? undefined;
  // "Too many requests": the wait the backend gives, from details or its headers (api-contract.md, sections 3 and 7).
  const waitHeader = Number(
    response.headers.get('retry-after') ?? response.headers.get('x-ratelimit-reset'),
  );
  const parsed = BackendErrorSchema.safeParse(json);
  if (!parsed.success) {
    return new AppError({
      code: response.status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR',
      status: response.status,
      requestId,
      outcomeUnknown: changesData && response.status >= 500,
    });
  }
  const { code, details, message } = parsed.data.error;
  const fields = Array.isArray(details) ? details : undefined;
  // Backend gap B1: details may carry a database constraint name. It is never used or passed on.
  let cleanDetails =
    details && !Array.isArray(details)
      ? Object.fromEntries(Object.entries(details).filter(([key]) => key !== 'constraint'))
      : undefined;
  if (
    response.status === 429 &&
    cleanDetails?.retryAfterSeconds === undefined &&
    Number.isFinite(waitHeader) &&
    waitHeader > 0
  ) {
    cleanDetails = { ...cleanDetails, retryAfterSeconds: waitHeader };
  }
  return new AppError({
    code,
    status: response.status,
    requestId: parsed.data.error.requestId ?? requestId,
    details: cleanDetails,
    fields,
    backendMessage: serverConfig.isProduction ? undefined : message,
    outcomeUnknown: changesData && response.status >= 500,
  });
}

/**
 * A private file from the backend (a vendor document, a photo not yet approved), passed on to the browser as it arrives
 * (Document 3, section 10). Returns the backend's answer when it is a file; an error answer becomes an AppError.
 */
export async function openBackendFile(options: {
  path: string;
  token: string;
  fetchImpl?: typeof fetch;
}): Promise<Response> {
  const response = await send(
    {
      method: 'GET',
      path: options.path,
      kind: 'upload',
      token: options.token,
      schema: null,
      fetchImpl: options.fetchImpl,
    },
    false,
  );
  if (response.ok) return response;
  const text = await response.text().catch(() => '');
  throw errorFrom(response, text ? safeJson(text) : undefined, false);
}

/**
 * The listed name of a real call (`GET /admin/vendors/{id}` for `GET /admin/vendors/7f3a`), for log lines. When two
 * listed paths fit, the one with more fixed parts wins (`/vendors/me/imports/template` over `/vendors/me/imports/{id}`).
 * Undefined when none fits.
 */
export function backendCallName(
  method: CallOptions<null>['method'],
  path: string,
): BackendCall | undefined {
  return CALL_PATTERNS.find((pattern) => pattern.method === method && pattern.matches.test(path))
    ?.call;
}

const CALL_PATTERNS = BACKEND_CALLS.map((call) => {
  const [method, listedPath = ''] = call.split(' ');
  const parts = listedPath.split('/');
  const isParameter = (part: string) => part.startsWith('{');
  const pattern = parts
    .map((part) => (isParameter(part) ? '[^/]+' : part.replace(/[.*+?^$()|[\]\\]/g, '\\$&')))
    .join('/');
  const fixedParts = parts.filter((part) => !isParameter(part)).length;
  return { call, method, matches: new RegExp(`^${pattern}$`), fixedParts };
}).sort((first, second) => second.fixedParts - first.fixedParts);

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
