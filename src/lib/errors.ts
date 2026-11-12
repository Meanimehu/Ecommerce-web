/**
 * One error type for every failed call (Document 3, section 5). The app decides by `code`, never by
 * the backend's text, and shows our own message for it (D-09).
 */
import { AppErrorCode, type ErrorCode } from './error-codes';
import type { Messages } from './i18n';

/** One backend field error (VALIDATION_FAILED): the backend's field name and its messages. */
export interface FieldError {
  field: string;
  messages: string[];
}

export interface AppErrorShape {
  code: ErrorCode;
  status: number;
  requestId?: string;
  details?: Record<string, unknown>;
  /** Field errors from VALIDATION_FAILED (Document 5, section 10). */
  fields?: FieldError[];
  /**
   * The backend's own text, carried only outside production to spot missing messages (Document 5,
   * section 10).
   */
  backendMessage?: string;
  /** A data-changing request may or may not have happened (timeout, lost connection). */
  outcomeUnknown?: boolean;
}

export class AppError extends Error implements AppErrorShape {
  readonly code: ErrorCode;
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

function isConnectionProblem(error: AppErrorShape): boolean {
  return error.code === AppErrorCode.Network || error.code === AppErrorCode.Timeout;
}

export function kindOf(error: AppErrorShape): ErrorKind {
  if (isConnectionProblem(error)) return 'network';
  if (error.status === 429) return 'rateLimit';
  if (error.status === 401 || error.status === 403) return 'access';
  if (error.status === 404 || error.status === 409) return 'conflict';
  if (error.status >= 400 && error.status < 500) return 'input';
  return 'server';
}

/**
 * Our own text for an error. A code without a message gets the general one for its kind; outside
 * production the backend's text is shown instead, so a missing message is easy to spot (Document 5,
 * section 10).
 */
export function messageFor(error: AppErrorShape, messages: Messages): string {
  // A change whose outcome is unknown is never called failed or done (D7-10).
  if (isConnectionProblem(error) && error.outcomeUnknown) return messages.errors.saveTimeout;
  if (error.code === AppErrorCode.Timeout) return messages.errors.viewTimeout;

  const messageForCode = (messages.errors.codes as Record<string, string>)[error.code];
  const showBackendText = Boolean(error.backendMessage) && process.env.NODE_ENV !== 'production';
  const generalMessage = showBackendText
    ? (error.backendMessage as string)
    : messages.errors.kinds[kindOf(error)];
  const message = messageForCode ?? generalMessage;

  return error.status === 429 ? withWaitingTime(message, error, messages) : message;
}

/** The backend's waiting time before trying again, in seconds, when it sends one. */
export function retryAfterSecondsOf(error: AppErrorShape): number | null {
  const seconds = Number(error.details?.retryAfterSeconds);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

/** "Too many requests" with how long to wait, where the backend says (Document 3, section 5). */
function withWaitingTime(message: string, error: AppErrorShape, messages: Messages): string {
  const retryAfterSeconds = retryAfterSecondsOf(error);
  if (retryAfterSeconds === null) return message;

  const errorText = messages.errors;
  const wholeSeconds = Math.ceil(retryAfterSeconds);
  const wholeMinutes = Math.ceil(retryAfterSeconds / 60);

  let waitingTime: string;
  if (wholeSeconds === 1) {
    waitingTime = errorText.waitSecond;
  } else if (wholeSeconds < 60) {
    waitingTime = fill(errorText.waitSeconds, { seconds: wholeSeconds });
  } else if (wholeMinutes === 1) {
    waitingTime = errorText.waitMinute;
  } else {
    waitingTime = fill(errorText.waitMinutes, { minutes: wholeMinutes });
  }

  return `${message} ${waitingTime}`;
}

/** Puts values into a message such as "Sent to {phone}". */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder,
  );
}

/** Any thrown value as an AppError; something that is not one counts as a lost connection. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError({ code: AppErrorCode.Network, status: 0 });
}

/** The reference number of a failed call, when a real one reached the browser (D5-14). */
export function requestIdOf(error: unknown): string | undefined {
  return error instanceof AppError ? error.requestId : undefined;
}
