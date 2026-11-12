/** The HTTP statuses our code acts on (Document 7, section 20.5). */
export enum HttpStatus {
  /** Our own: no answer reached us (lost connection, time limit, cancelled upload). */
  NoResponse = 0,
  NoContent = 204,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  TooManyRequests = 429,
  ServerError = 500,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
}

const FIRST_SUCCESS = 200;
const FIRST_REDIRECT = 300;
const FIRST_CLIENT_ERROR = 400;
const FIRST_SERVER_ERROR = 500;

export function isSuccess(status: number): boolean {
  return status >= FIRST_SUCCESS && status < FIRST_REDIRECT;
}

export function isClientError(status: number): boolean {
  return status >= FIRST_CLIENT_ERROR && status < FIRST_SERVER_ERROR;
}

export function isServerError(status: number): boolean {
  return status >= FIRST_SERVER_ERROR;
}
