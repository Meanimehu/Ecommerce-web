/**
 * One error type for every failed call (Document 3, section 5). The app decides by `code`, never by the backend's text.
 * Messages come from the catalogue (D-09); unknown codes fall back to a general message by kind of failure.
 */
import type { Messages } from './i18n';

/** Codes the frontend itself produces (not from the backend). */
export const FRONTEND_CODES = ['TIMEOUT', 'NETWORK', 'CSRF_INVALID', 'ORIGIN_INVALID', 'SESSION_TEMPORARY', 'RESPONSE_MISMATCH', 'UPLOAD_CANCELLED'] as const;

/** One backend field error (VALIDATION_FAILED): the backend's field name and its messages. */
export interface FieldError {
  field: string;
  messages: string[];
}

export interface AppErrorShape {
  code: string;
  status: number;
  requestId?: string;
  details?: Record<string, unknown>;
  /** Field errors from VALIDATION_FAILED (Document 5, section 10). */
  fields?: FieldError[];
  /** The backend's own text. Carried only outside production, as a development fallback (Document 5, section 10). */
  backendMessage?: string;
  /** True when a data-changing request may or may not have happened (timeout, lost connection). */
  outcomeUnknown?: boolean;
}

export class AppError extends Error implements AppErrorShape {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: Record<string, unknown>;
  readonly fields?: FieldError[];
  readonly backendMessage?: string;
  readonly outcomeUnknown?: boolean;

  constructor(shape: AppErrorShape) {
    super(shape.code);
    this.name = 'AppError';
    this.code = shape.code;
    this.status = shape.status;
    this.requestId = shape.requestId;
    this.details = shape.details;
    this.fields = shape.fields;
    this.backendMessage = shape.backendMessage;
    this.outcomeUnknown = shape.outcomeUnknown;
  }
}

export type ErrorKind = keyof Messages['errors']['kinds'];

export function kindOf(error: AppErrorShape): ErrorKind {
  if (error.code === 'NETWORK' || error.code === 'TIMEOUT') return 'network';
  if (error.status === 429) return 'rateLimit';
  if (error.status === 401 || error.status === 403) return 'access';
  if (error.status === 404 || error.status === 409) return 'conflict';
  if (error.status >= 400 && error.status < 500) return 'input';
  return 'server';
}

/**
 * Our own text for an error (D-09; Document 7, D7-10 for timeouts). Unknown codes get the general message for their
 * kind; outside production the backend's text is shown instead, to spot missing messages (Document 5, section 10).
 */
export function messageFor(error: AppErrorShape, messages: Messages): string {
  // A change whose outcome is unknown (timeout or lost connection): never "failed", never "done" (D7-10; Document 3, section 6).
  if ((error.code === 'TIMEOUT' || error.code === 'NETWORK') && error.outcomeUnknown) return messages.errors.saveTimeout;
  if (error.code === 'TIMEOUT') return messages.errors.viewTimeout;
  const byCode = (messages.errors.codes as Record<string, string>)[error.code];
  const base = byCode ?? (error.backendMessage && process.env.NODE_ENV !== 'production' ? error.backendMessage : messages.errors.kinds[kindOf(error)]);
  return error.status === 429 ? withWait(base, error, messages) : base;
}

/** "Too many requests": a friendly wait message with the backend's waiting time, where it gives one (Document 3, section 5). */
function withWait(text: string, error: AppErrorShape, messages: Messages): string {
  const seconds = Number(error.details?.retryAfterSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return text;
  const secs = Math.ceil(seconds);
  const mins = Math.ceil(seconds / 60);
  const e = messages.errors;
  const wait = secs < 60 ? (secs === 1 ? e.waitSecond : fill(e.waitSeconds, { seconds: secs })) : mins === 1 ? e.waitMinute : fill(e.waitMinutes, { minutes: mins });
  return `${text} ${wait}`;
}

/** Puts values into a message such as "Sent to {phone}". */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
}

/** Any thrown value as an AppError (something that is not one counts as a lost connection). */
export function toAppError(error: unknown): AppError {
  return error instanceof AppError ? error : new AppError({ code: 'NETWORK', status: 0 });
}

/** The reference number of a failed call, when a real one reached the browser (D5-14). */
export function requestIdOf(error: unknown): string | undefined {
  return error instanceof AppError ? error.requestId : undefined;
}
