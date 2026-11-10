/**
 * Backend error codes that the screens built so far can show (Document 7, D7-15). Each slice adds the codes of its
 * screens. `npm run check:messages` fails if one of these has no English or Hindi message, or is not a backend code.
 * By launch this list is the whole backend catalogue (src/generated/backend-error-codes.json).
 */
export const BACKEND_CODES_IN_USE = [
  // general (api-contract.md, section 11, "request shape and access")
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  // login, tokens and sessions (Area 1): Slice 1
  'PHONE_INVALID',
  'OTP_RESEND_WAIT',
  'OTP_RATE_LIMITED',
  'OTP_INVALID',
  'OTP_LOCKED',
  'OTP_EXPIRED',
  'SMS_UNAVAILABLE',
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'TOKEN_REUSED',
  'SESSION_ENDED',
  'USER_BLOCKED',
] as const;

/** Frontend codes that need their own message (the others use the general messages by kind). */
export const FRONTEND_CODES_WITH_MESSAGES = ['CSRF_INVALID', 'ORIGIN_INVALID', 'SESSION_STALE', 'SESSION_TEMPORARY'] as const;
