import { BackendErrorCode } from '@/types/generated/backend-error-codes';

/**
 * Error codes the frontend knows that are not in the backend's error catalogue (Document 7, section
 * 20.4). The catalogue's own codes are BackendErrorCode, generated from the backend and never
 * written here.
 */
export enum AppErrorCode {
  // Produced by our own code in the browser or in our endpoints.
  Network = 'NETWORK',
  Timeout = 'TIMEOUT',
  CsrfInvalid = 'CSRF_INVALID',
  OriginInvalid = 'ORIGIN_INVALID',
  SessionTemporary = 'SESSION_TEMPORARY',
  ResponseMismatch = 'RESPONSE_MISMATCH',
  UploadCancelled = 'UPLOAD_CANCELLED',
  ServerError = 'SERVER_ERROR',
  UnknownError = 'UNKNOWN_ERROR',

  // Sent by the backend's framework outside its catalogue (api-contract.md, section 3); our
  // endpoints use NotFound too.
  NotFound = 'NOT_FOUND',
  TooManyRequests = 'TOO_MANY_REQUESTS',
}

/**
 * Any code an error can carry. A code the frontend does not know yet (a newer backend) is still a
 * string; it gets the general message for its kind of failure (Document 7, section 19).
 */
export type ErrorCode = BackendErrorCode | AppErrorCode | (string & {});

export { BackendErrorCode };
