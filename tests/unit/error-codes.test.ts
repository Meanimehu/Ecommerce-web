import { describe, expect, it } from 'vitest';
import { AppErrorCode, BackendErrorCode } from '@/lib/error-codes';
import { AppError, messageFor, retryAfterSecondsOf, toAppError } from '@/lib/errors';
import { HttpStatus, isClientError, isServerError, isSuccess } from '@/lib/http-status';
import { getMessages } from '@/lib/messages';
import { SessionNotice } from '@/hooks/use-session';
import { AddOutcome, isAddNotice } from '@/types/add-notice';
import { isSingular } from '@/utils/format';
import { enumMemberName } from '../../scripts/gen-error-codes';

const englishMessages = getMessages('en');

describe('error-code enums (Document 7, section 20.4)', () => {
  it('names each backend code in PascalCase and keeps the value exactly', () => {
    expect(enumMemberName('OTP_RESEND_WAIT')).toBe('OtpResendWait');
    expect(enumMemberName('VALIDATION_FAILED')).toBe('ValidationFailed');
    expect(BackendErrorCode.OtpResendWait).toBe('OTP_RESEND_WAIT');
  });

  it('turns anything that is not an AppError into a lost connection', () => {
    expect(toAppError(new Error('boom')).code).toBe(AppErrorCode.Network);
    const backendError = new AppError({ code: BackendErrorCode.OtpInvalid, status: 400 });
    expect(toAppError(backendError)).toBe(backendError);
  });
});

describe('waiting time on "too many requests"', () => {
  const tooManyRequests = (retryAfterSeconds?: number) =>
    new AppError({
      code: AppErrorCode.TooManyRequests,
      status: 429,
      details: retryAfterSeconds === undefined ? {} : { retryAfterSeconds },
    });

  it('reads the backend time only when it is a positive number', () => {
    expect(retryAfterSecondsOf(tooManyRequests(30))).toBe(30);
    expect(retryAfterSecondsOf(tooManyRequests(0))).toBeNull();
    expect(retryAfterSecondsOf(tooManyRequests())).toBeNull();
  });

  it('says one second, seconds, one minute or minutes', () => {
    const errorText = englishMessages.errors;
    expect(messageFor(tooManyRequests(1), englishMessages)).toContain(errorText.waitSecond);
    expect(messageFor(tooManyRequests(45), englishMessages)).toContain(
      errorText.waitSeconds.replace('{seconds}', '45'),
    );
    expect(messageFor(tooManyRequests(60), englishMessages)).toContain(errorText.waitMinute);
    expect(messageFor(tooManyRequests(150), englishMessages)).toContain(
      errorText.waitMinutes.replace('{minutes}', '3'),
    );
  });
});

describe('named values (Document 7, section 20.5)', () => {
  it('sorts statuses into success, client error and server error', () => {
    expect(isSuccess(HttpStatus.NoContent)).toBe(true);
    expect(isClientError(HttpStatus.TooManyRequests)).toBe(true);
    expect(isServerError(HttpStatus.ServiceUnavailable)).toBe(true);
    expect(isServerError(HttpStatus.NotFound)).toBe(false);
  });

  it('picks the one-item form only for exactly one', () => {
    expect(isSingular(1)).toBe(true);
    expect(isSingular(2)).toBe(false);
  });

  it('accepts only the known add-to-cart outcomes from browser storage', () => {
    expect(isAddNotice({ outcome: AddOutcome.Added })).toBe(true);
    expect(isAddNotice({ outcome: 'something-else' })).toBe(false);
    expect(isAddNotice(null)).toBe(false);
  });

  it('keeps the stored values of the session notices', () => {
    expect(SessionNotice.Blocked).toBe('blocked');
    expect(SessionNotice.Ended).toBe('ended');
  });
});
