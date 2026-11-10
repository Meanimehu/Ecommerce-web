import { AppError } from '@/lib/errors';

/**
 * Browser calls to our own server (Document 3, D3-03: the browser never calls the backend). Every request has a time
 * limit; saves are never repeated automatically (D7-01, D7-10). The anti-forgery token comes from GET /api/session,
 * lives in memory only, and goes in the X-Dhaaga-CSRF header (Document 4, section 9; D7-13).
 */
const TIMEOUT_MS = 20_000;
const TOKEN_MAX_AGE_MS = 10 * 60_000;

let csrf: { token: string; at: number } | null = null;

export function rememberCsrf(token: unknown): void {
  if (typeof token === 'string' && token) csrf = { token, at: Date.now() };
}

export function forgetCsrf(): void {
  csrf = null;
}

export interface SessionUser {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  roles: string[];
}

export interface SessionAnswer {
  user: SessionUser | null;
  csrfToken: string;
}

async function parseError(response: Response, changesData: boolean): Promise<AppError> {
  const body = (await response.json().catch(() => null)) as { error?: Record<string, unknown> } | null;
  const error = body?.error ?? {};
  rememberCsrf(error.csrfToken);
  const details = { ...((error.details as Record<string, unknown> | undefined) ?? {}), ...(error.handle ? { handle: error.handle } : {}) };
  return new AppError({
    code: typeof error.code === 'string' ? error.code : response.status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR',
    status: response.status,
    requestId: typeof error.requestId === 'string' ? error.requestId : undefined,
    details,
    outcomeUnknown: Boolean(error.outcomeUnknown) || (changesData && response.status >= 500 && response.status !== 503),
  });
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
  const changesData = method !== 'GET';
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
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

export async function getSession(): Promise<SessionAnswer> {
  const answer = await request<SessionAnswer>('GET', '/api/session');
  rememberCsrf(answer.csrfToken);
  return answer;
}

async function csrfToken(): Promise<string> {
  if (!csrf || Date.now() - csrf.at > TOKEN_MAX_AGE_MS) {
    try {
      await getSession();
    } catch (error) {
      // A session problem still carries a pre-login token (for logging in again, or compare-and-clear).
      if (!csrf) throw error;
    }
  }
  return csrf?.token ?? '';
}

/** A data-changing request. Never repeated automatically. */
export async function send<T>(path: string, body: unknown = {}): Promise<T> {
  return request<T>('POST', path, body, { 'x-dhaaga-csrf': await csrfToken() });
}
