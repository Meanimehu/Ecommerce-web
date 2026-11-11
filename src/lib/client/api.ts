import { AppError } from '@/lib/errors';
import type { User } from '@/schemas/accounts';

/**
 * Browser calls to our own server (Document 3, D3-03: the browser never calls the backend). Every request has a time
 * limit; saves are never repeated automatically (D7-01, D7-10). Every change carries our fixed header, which another
 * site cannot add (Document 7, section 17.3).
 */
const TIMEOUT_MS = 20_000;
const FORGERY_HEADER = { 'x-dhaaga-csrf': '1' };

export interface SessionAnswer {
  /** The User of Area 1, as checked by the server against UserSchema; the type is inferred from that schema. */
  user: User | null;
}

async function parseError(response: Response, changesData: boolean): Promise<AppError> {
  const body = (await response.json().catch(() => null)) as { error?: Record<string, unknown> } | null;
  const error = body?.error ?? {};
  return new AppError({
    code: typeof error.code === 'string' ? error.code : response.status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR',
    status: response.status,
    requestId: typeof error.requestId === 'string' ? error.requestId : undefined,
    details: (error.details as Record<string, unknown> | undefined) ?? {},
    fields: Array.isArray(error.fields) ? (error.fields as AppError['fields']) : undefined,
    backendMessage: typeof error.backendMessage === 'string' ? error.backendMessage : undefined,
    outcomeUnknown: Boolean(error.outcomeUnknown) || (changesData && response.status >= 500 && response.status !== 503),
  });
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const changesData = method !== 'GET';
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(changesData ? FORGERY_HEADER : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new AppError({ code: timedOut ? 'TIMEOUT' : 'NETWORK', status: 0, outcomeUnknown: changesData });
  }
  if (!response.ok) throw await parseError(response, changesData);
  return (await response.json()) as T;
}

export const getSession = (): Promise<SessionAnswer> => request<SessionAnswer>('GET', '/api/session');

/** A data-changing request. Never repeated automatically. */
export const send = <T>(path: string, body: unknown = {}): Promise<T> => request<T>('POST', path, body);
