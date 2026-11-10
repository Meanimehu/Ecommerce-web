/**
 * One error type for every failed call (Document 3, section 5). The app decides by `code`, never by the backend's text.
 * Messages come from the catalogue (D-09); unknown codes fall back to a general message by kind of failure.
 */
import type { Messages } from './messages';

/** Codes the frontend itself produces (not from the backend). */
export const FRONTEND_CODES = ['TIMEOUT', 'NETWORK', 'CSRF_INVALID', 'ORIGIN_INVALID', 'SESSION_STALE', 'SESSION_TEMPORARY', 'RESPONSE_MISMATCH'] as const;

export interface AppErrorShape {
  code: string;
  status: number;
  requestId?: string;
  details?: Record<string, unknown>;
  /** True when a data-changing request may or may not have happened (timeout, lost connection). */
  outcomeUnknown?: boolean;
}

export class AppError extends Error implements AppErrorShape {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: Record<string, unknown>;
  readonly outcomeUnknown?: boolean;

  constructor(shape: AppErrorShape) {
    super(shape.code);
    this.name = 'AppError';
    this.code = shape.code;
    this.status = shape.status;
    this.requestId = shape.requestId;
    this.details = shape.details;
    this.outcomeUnknown = shape.outcomeUnknown;
  }

  toJSON(): AppErrorShape {
    return { code: this.code, status: this.status, requestId: this.requestId, details: this.details, outcomeUnknown: this.outcomeUnknown };
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

/** Our own text for an error (D-09; Document 7, D7-10 for timeouts). */
export function messageFor(error: AppErrorShape, messages: Messages): string {
  if (error.code === 'TIMEOUT') return error.outcomeUnknown ? messages.errors.saveTimeout : messages.errors.viewTimeout;
  const byCode = (messages.errors.codes as Record<string, string>)[error.code];
  return byCode ?? messages.errors.kinds[kindOf(error)];
}

/** Puts values into a message such as "Sent to {phone}". */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
}
