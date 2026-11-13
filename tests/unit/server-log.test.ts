import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackendErrorCode } from '@/lib/error-codes';
import { errorTypeOf, logServerEvent, ServerEvent } from '@/lib/server-log';

describe('server log lines (Document 7, section 20.10; D7-18)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('writes one plain-text line in the backend style, at the level of the event', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logServerEvent(ServerEvent.LogoutBackendFailed, {
      code: BackendErrorCode.SessionEnded,
      flags: { everywhere: true },
    });
    expect(warn).toHaveBeenCalledWith('logout_backend_failed code=SESSION_ENDED everywhere=true');
  });

  it('puts the request id first, and errors go to the error log', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    logServerEvent(ServerEvent.UnexpectedError, { requestId: 'abc-123', code: 'SERVER_ERROR' });
    expect(error).toHaveBeenCalledWith('[abc-123] unexpected_error code=SERVER_ERROR');
  });

  it('names a backend call by its listed path and gives field names only', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logServerEvent(ServerEvent.LogoutBackendUnconfirmed, {
      call: 'POST /auth/logout',
      fields: ['user.id', 'roles'],
    });
    expect(warn).toHaveBeenCalledWith(
      'logout_backend_unconfirmed call="POST /auth/logout" fields=user.id,roles',
    );
  });

  it('an unexpected error is logged by its kind, never its message', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const caughtError = new TypeError('phone 9876543210 is not a function');
    logServerEvent(ServerEvent.UnexpectedError, {
      requestId: 'abc-123',
      code: 'SERVER_ERROR',
      errorType: errorTypeOf(caughtError),
    });
    expect(error).toHaveBeenCalledWith(
      '[abc-123] unexpected_error code=SERVER_ERROR errorType=TypeError',
    );
  });

  it('names built-in errors, calls every other error Error, and anything else NotAnError', () => {
    class LibraryError extends Error {}
    expect(errorTypeOf(new RangeError('x'))).toBe('RangeError');
    expect(errorTypeOf(new SyntaxError('x'))).toBe('SyntaxError');
    expect(errorTypeOf(new LibraryError('x'))).toBe('Error');
    expect(errorTypeOf('a thrown string')).toBe('NotAnError');
    expect(errorTypeOf(undefined)).toBe('NotAnError');
  });
});
