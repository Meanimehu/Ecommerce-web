import { AppError } from '@/lib/errors';

/**
 * Browser calls to our own server (Document 3, D3-03: the browser never calls the backend). Every request has a time
 * limit; saves are never repeated automatically (D7-01, D7-10). Every change carries our fixed header, which another
 * site cannot add (Document 7, section 17.3).
 */
const TIMEOUT_MS = 20_000;
const FORGERY_HEADER = { 'x-dhaaga-csrf': '1' };

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

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
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
  if (response.status === 204) return null as T;
  return (await response.json()) as T;
}

/** A read. Safe to repeat. */
export const get = <T>(path: string): Promise<T> => request<T>('GET', path);

/** Data-changing requests. Never repeated automatically. */
export const send = <T>(path: string, body: unknown = {}): Promise<T> => request<T>('POST', path, body);
export const patch = <T>(path: string, body: unknown): Promise<T> => request<T>('PATCH', path, body);
export const put = <T>(path: string, body: unknown): Promise<T> => request<T>('PUT', path, body);
export const remove = <T = null>(path: string): Promise<T> => request<T>('DELETE', path);

/**
 * A file upload (Document 3, section 10): one file per request, progress reported as it is sent, can be cancelled, and
 * never repeated automatically. The browser's XMLHttpRequest is used because fetch cannot report upload progress.
 * A cancelled upload rejects with the code UPLOAD_CANCELLED, which screens do not show as an error.
 */
const UPLOAD_TIMEOUT_MS = 75_000;

export function upload<T>(path: string, form: FormData, options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', path);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.withCredentials = true;
    xhr.setRequestHeader('accept', 'application/json');
    for (const [name, value] of Object.entries(FORGERY_HEADER)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) options.onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      const response = new Response(xhr.responseText || null, { status: xhr.status, headers: { 'content-type': 'application/json' } });
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((xhr.responseText ? JSON.parse(xhr.responseText) : null) as T);
      } else {
        void parseError(response, true).then(reject);
      }
    };
    xhr.onerror = () => reject(new AppError({ code: 'NETWORK', status: 0, outcomeUnknown: true }));
    xhr.ontimeout = () => reject(new AppError({ code: 'TIMEOUT', status: 0, outcomeUnknown: true }));
    xhr.onabort = () => reject(new AppError({ code: 'UPLOAD_CANCELLED', status: 0 }));
    options.signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}
