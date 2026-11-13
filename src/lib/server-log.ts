import 'server-only';
import { serverConfig } from '@/lib/config';
import type { ErrorCode } from '@/lib/error-codes';
import type { BackendCall } from '@/types/generated/backend-calls';

/**
 * The only way our server writes a log (Document 7, section 20.10; D7-18): one plain-text line per
 * event, in the backend's style, for example
 * `[requestId] logout_backend_failed code=SESSION_ENDED everywhere=true`.
 * The details accept only what is safe to log; anything else fails to compile.
 */
export enum ServerEvent {
  LogoutBackendUnconfirmed = 'logout_backend_unconfirmed',
  LogoutBackendFailed = 'logout_backend_failed',
  UnexpectedError = 'unexpected_error',
  ResponseMismatch = 'response_mismatch',
}

enum LogLevel {
  Warning = 'warning',
  Error = 'error',
}

/** Every event has a level here; an event added to `ServerEvent` without one fails the build. */
const EVENT_LEVELS: Record<ServerEvent, LogLevel> = {
  [ServerEvent.LogoutBackendUnconfirmed]: LogLevel.Warning,
  [ServerEvent.LogoutBackendFailed]: LogLevel.Warning,
  [ServerEvent.UnexpectedError]: LogLevel.Error,
  [ServerEvent.ResponseMismatch]: LogLevel.Error,
};

declare const errorTypeBrand: unique symbol;

/** The kind of an unexpected error. Only `errorTypeOf` makes one, so no message can get in. */
export type ErrorType = string & { readonly [errorTypeBrand]: true };

const BUILT_IN_ERRORS = [
  TypeError,
  RangeError,
  SyntaxError,
  ReferenceError,
  URIError,
  EvalError,
  AggregateError,
] as const;

/**
 * A built-in error's name, `Error` for any other error (its class name may be shortened in a
 * production build), or `NotAnError` when something else was thrown.
 */
export function errorTypeOf(caughtError: unknown): ErrorType {
  const builtIn = BUILT_IN_ERRORS.find((BuiltInError) => caughtError instanceof BuiltInError);
  if (builtIn) return builtIn.name as ErrorType;
  return (caughtError instanceof Error ? 'Error' : 'NotAnError') as ErrorType;
}

/** The names a true/false detail may have. A new one is added here first. */
type LogFlag = 'everywhere';

export interface ServerEventDetails {
  /** Only our own random id or the id the backend sent. */
  requestId?: string;
  code?: ErrorCode;
  /** A call by its name in the generated list (`GET /admin/vendors/{id}`), never its real address. */
  call?: BackendCall;
  /** Field paths from a schema check, never their values. */
  fields?: readonly string[];
  flags?: Partial<Record<LogFlag, boolean>>;
  errorType?: ErrorType;
}

export function logServerEvent(event: ServerEvent, details: ServerEventDetails = {}): void {
  const parts: string[] = [];
  if (details.requestId) parts.push(`[${details.requestId}]`);
  parts.push(event);
  if (details.call) parts.push(`call="${details.call}"`);
  if (details.code) parts.push(`code=${details.code}`);
  if (details.errorType) parts.push(`errorType=${details.errorType}`);
  if (details.fields?.length) parts.push(`fields=${details.fields.join(',')}`);
  for (const [name, value] of Object.entries(details.flags ?? {})) parts.push(`${name}=${value}`);

  const line = parts.join(' ');
  if (EVENT_LEVELS[event] === LogLevel.Error) console.error(line);
  else console.warn(line);
}

/**
 * The full text of an unexpected error, outside production only: its message can contain data
 * (section 20.10), so production logs only the event and its request id.
 */
export function logErrorDetailsOutsideProduction(error: unknown): void {
  if (!serverConfig.isProduction) console.error(error);
}
