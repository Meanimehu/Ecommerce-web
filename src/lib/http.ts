import { AppErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { HttpStatus, isServerError, isSuccess } from '@/lib/http-status';

/**
 * Browser calls to our own server; the browser never calls the backend (D3-03). Every request has
 * a time limit, saves are never repeated automatically (D7-01, D7-10), and every change carries our
 * fixed header, which another site cannot add (Document 7, section 17.3).
 *
 * Every failure rejects with an AppError, so screens and hooks never need to convert one
 * (Document 7, section 20.9).
 */
const TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 75_000;
const FORGERY_HEADER = { 'x-dhaaga-csrf': '1' };
const EMPTY_BODY_BYTES = 0;

enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
  Patch = 'PATCH',
  Put = 'PUT',
  Delete = 'DELETE',
}

/** The names a browser gives a request that ran out of time or was stopped. */
enum BrowserErrorName {
  Timeout = 'TimeoutError',
  Abort = 'AbortError',
}

interface ErrorAnswer {
  error?: Record<string, unknown>;
}

async function parseError(response: Response, changesData: boolean): Promise<AppError> {
  const answer = (await response.json().catch(() => null)) as ErrorAnswer | null;
  const error = answer?.error ?? {};

  const codeWhenMissing = isServerError(response.status)
    ? AppErrorCode.ServerError
    : AppErrorCode.UnknownError;
  // A save that hit a server failure may or may not have happened; "temporarily unavailable"
  // means it was refused before anything was done.
  const saveMayHaveHappened =
    changesData &&
    isServerError(response.status) &&
    response.status !== HttpStatus.ServiceUnavailable;

  return new AppError({
    code: typeof error.code === 'string' ? error.code : codeWhenMissing,
    status: response.status,
    requestId: typeof error.requestId === 'string' ? error.requestId : undefined,
    details: (error.details as Record<string, unknown> | undefined) ?? {},
    fields: Array.isArray(error.fields) ? (error.fields as AppError['fields']) : undefined,
    backendMessage: typeof error.backendMessage === 'string' ? error.backendMessage : undefined,
    outcomeUnknown: Boolean(error.outcomeUnknown) || saveMayHaveHappened,
  });
}

function answerNotUsable(status: number): AppError {
  return new AppError({ code: AppErrorCode.ResponseMismatch, status });
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const changesData = method !== HttpMethod.Get;
  const hasBody = body !== undefined;

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
        ...(hasBody ? { 'content-type': 'application/json' } : {}),
        ...(changesData ? FORGERY_HEADER : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (caughtError) {
    const ranOutOfTime =
      caughtError instanceof DOMException &&
      (caughtError.name === BrowserErrorName.Timeout ||
        caughtError.name === BrowserErrorName.Abort);

    throw new AppError({
      code: ranOutOfTime ? AppErrorCode.Timeout : AppErrorCode.Network,
      status: HttpStatus.NoResponse,
      outcomeUnknown: changesData,
    });
  }

  if (!response.ok) throw await parseError(response, changesData);
  if (response.status === HttpStatus.NoContent) return null as T;

  try {
    return (await response.json()) as T;
  } catch {
    throw answerNotUsable(response.status);
  }
}

/** A read. Safe to repeat. */
export const get = <T>(path: string): Promise<T> => request<T>(HttpMethod.Get, path);

/** Data-changing requests. Never repeated automatically. */
export const send = <T>(path: string, body: unknown = {}): Promise<T> =>
  request<T>(HttpMethod.Post, path, body);

export const patch = <T>(path: string, body: unknown): Promise<T> =>
  request<T>(HttpMethod.Patch, path, body);

export const put = <T>(path: string, body: unknown): Promise<T> =>
  request<T>(HttpMethod.Put, path, body);

export const remove = <T = null>(path: string): Promise<T> => request<T>(HttpMethod.Delete, path);

/**
 * A file upload (Document 3, section 10): one file per request, progress reported as it is sent,
 * can be cancelled, and never repeated automatically. XMLHttpRequest is used because fetch cannot
 * report upload progress. A cancelled upload rejects with UPLOAD_CANCELLED, which screens do not
 * show as an error.
 */
export function upload<T>(
  path: string,
  form: FormData,
  options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(HttpMethod.Post, path);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.withCredentials = true;
    xhr.setRequestHeader('accept', 'application/json');
    for (const [headerName, headerValue] of Object.entries(FORGERY_HEADER)) {
      xhr.setRequestHeader(headerName, headerValue);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > EMPTY_BODY_BYTES) {
        options.onProgress?.(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      if (!isSuccess(xhr.status)) {
        const response = new Response(xhr.responseText || null, {
          status: xhr.status,
          headers: { 'content-type': 'application/json' },
        });
        void parseError(response, true).then(reject);
        return;
      }
      try {
        resolve((xhr.responseText ? JSON.parse(xhr.responseText) : null) as T);
      } catch {
        reject(answerNotUsable(xhr.status));
      }
    };
    xhr.onerror = () =>
      reject(
        new AppError({
          code: AppErrorCode.Network,
          status: HttpStatus.NoResponse,
          outcomeUnknown: true,
        }),
      );
    xhr.ontimeout = () =>
      reject(
        new AppError({
          code: AppErrorCode.Timeout,
          status: HttpStatus.NoResponse,
          outcomeUnknown: true,
        }),
      );
    xhr.onabort = () =>
      reject(new AppError({ code: AppErrorCode.UploadCancelled, status: HttpStatus.NoResponse }));

    options.signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}
