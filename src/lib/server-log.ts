import 'server-only';
import { serverConfig } from '@/lib/config';
import type { ErrorCode } from '@/lib/error-codes';
import type { paths } from '@/types/generated/backend-api';

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
};

type BackendMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Our calls name paths without the backend's `/api/v1` prefix (`src/api/client.ts` adds it). */
type BackendPath<Listed> = Listed extends `/api/v1${infer Path}` ? Path : Listed;

/**
 * A backend call by its name in the generated path list (`POST /auth/otp/verify`,
 * `GET /vendors/{id}`), so no value from a real address can appear in a log.
 */
export type BackendCall = `${BackendMethod} ${BackendPath<Extract<keyof paths, string>>}`;

/** The names a true/false detail may have. A new one is added here first. */
type LogFlag = 'everywhere';

export interface ServerEventDetails {
  /** Only our own random id or the id the backend sent. */
  requestId?: string;
  code?: ErrorCode;
  call?: BackendCall;
  /** Field paths from a schema check, never their values. */
  fields?: readonly string[];
  flags?: Partial<Record<LogFlag, boolean>>;
}

export function logServerEvent(event: ServerEvent, details: ServerEventDetails = {}): void {
  const parts: string[] = [];
  if (details.requestId) parts.push(`[${details.requestId}]`);
  parts.push(event);
  if (details.call) parts.push(`call="${details.call}"`);
  if (details.code) parts.push(`code=${details.code}`);
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
