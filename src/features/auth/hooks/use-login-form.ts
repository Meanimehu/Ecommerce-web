'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import { retryAfterSecondsOf, type AppError } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { keepAddNotice } from '@/hooks/use-cart';
import {
  CodeFormSchema,
  PhoneFormSchema,
  type CodeFormInput,
  type CodeFormValues,
  type PhoneFormInput,
  type PhoneFormValues,
} from '@/features/auth/types';
import { reloadSession, useRequestLoginCode, useVerifyLoginCode, type LoggedIn } from './use-auth';

/**
 * The login form's logic (Document 2, section 3): what each step does on submit, on success and on
 * each error. The screen, `features/auth/components/login-form.tsx`, only draws (Document 7,
 * section 20.9).
 */

/** What the code step starts with, once a code has been sent. */
export interface SentCode {
  phone: string;
  resendAfterSeconds: number;
  notice: string | null;
}

const PHONE_FIELD_ERRORS = {
  [BackendErrorCode.PhoneInvalid]: 'phone',
} as const;

const CODE_FIELD_ERRORS = {
  [BackendErrorCode.OtpInvalid]: 'code',
  [BackendErrorCode.OtpExpired]: 'code',
  [BackendErrorCode.OtpLocked]: 'code',
} as const;

const MILLISECONDS_PER_SECOND = 1000;
const NO_WAIT_SECONDS = 0;

export type PhoneStepState = ReturnType<typeof usePhoneStep>;

export function usePhoneStep({ onCodeSent }: { onCodeSent: (sentCode: SentCode) => void }) {
  const messages = useMessages();
  const form = useAppForm<PhoneFormInput, PhoneFormValues>(PhoneFormSchema, { phone: '' });
  const requestLoginCode = useRequestLoginCode();
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();

  function sendCode({ phone }: PhoneFormValues) {
    requestLoginCode.mutate(phone, {
      onSuccess: (codeSent) =>
        onCodeSent({ phone, resendAfterSeconds: codeSent.resendAfterSeconds, notice: null }),
      onError: (error) => showSendCodeError(phone, error),
    });
  }

  function showSendCodeError(phone: string, error: AppError) {
    // A code was sent a moment ago: not a mistake, so go on to the code step and show the wait.
    if (error.code === BackendErrorCode.OtpResendWait) {
      onCodeSent({
        phone,
        resendAfterSeconds: retryAfterSecondsOf(error) ?? NO_WAIT_SECONDS,
        notice: messages.errors.codes[BackendErrorCode.OtpResendWait],
      });
      return;
    }

    applyServerError(form, error, messages, { codes: PHONE_FIELD_ERRORS });
    focusErrorSummary();
  }

  return {
    form,
    sendCode,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isSending: requestLoginCode.isPending,
    requestId: requestLoginCode.error?.requestId,
  };
}

export function useCodeStep({ lang, sentCode }: { lang: Locale; sentCode: SentCode }) {
  const messages = useMessages();
  const queryClient = useQueryClient();
  const form = useAppForm<CodeFormInput, CodeFormValues>(CodeFormSchema, { code: '' });
  const requestLoginCode = useRequestLoginCode();
  const verifyLoginCode = useVerifyLoginCode();
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const resendCountdown = useResendCountdown(sentCode.resendAfterSeconds);
  const [notice, setNotice] = useState(sentCode.notice);
  const { phone } = sentCode;

  useEffect(() => {
    form.setFocus('code');
  }, [form]);

  function verifyCode({ code }: CodeFormValues) {
    verifyLoginCode.mutate(
      { phone, code, lang },
      { onSuccess: goToNextPage, onError: (error) => void showVerifyError(error) },
    );
  }

  function goToNextPage(loggedIn: LoggedIn) {
    // The page the person goes back to says what happened to their "Add to cart" (D2-02).
    if (loggedIn.pendingAdd) keepAddNotice(loggedIn.pendingAdd);
    queryClient.clear();
    // A full page load: the next page is rendered on the server with the new cookies.
    window.location.assign(loggedIn.destination);
  }

  async function showVerifyError(error: AppError) {
    // The answer was lost, so the login may have worked: look at the session once (Document 3,
    // section 6) and go by what is there.
    if (error.outcomeUnknown) {
      const session = await reloadSession(queryClient);
      if (session?.user) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/${lang}/account`);
        return;
      }
    }

    applyServerError(form, error, messages, { codes: CODE_FIELD_ERRORS });
    focusErrorSummary();
  }

  function resendCode() {
    form.clearErrors();
    requestLoginCode.mutate(phone, {
      onSuccess: (codeSent) => {
        resendCountdown.start(codeSent.resendAfterSeconds);
        setNotice(messages.login.codeSent);
      },
      onError: showResendError,
    });
  }

  function showResendError(error: AppError) {
    const retryAfterSeconds = retryAfterSecondsOf(error);
    if (error.code === BackendErrorCode.OtpResendWait && retryAfterSeconds !== null) {
      resendCountdown.start(retryAfterSeconds);
    }
    applyServerError(form, error, messages);
    focusErrorSummary();
  }

  return {
    form,
    phone,
    notice,
    verifyCode,
    resendCode,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    secondsUntilResend: resendCountdown.secondsLeft,
    mustWaitToResend: resendCountdown.isWaiting,
    isVerifying: verifyLoginCode.isPending,
    isBusy: verifyLoginCode.isPending || requestLoginCode.isPending,
    requestId: (verifyLoginCode.error ?? requestLoginCode.error)?.requestId,
  };
}

/** Seconds until "Send code again" may be used; the wait always comes from the backend. */
function useResendCountdown(initialSeconds: number) {
  const [availableAt, setAvailableAt] = useState(
    () => Date.now() + initialSeconds * MILLISECONDS_PER_SECOND,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (availableAt <= now) return;
    const timer = setInterval(() => setNow(Date.now()), MILLISECONDS_PER_SECOND);
    return () => clearInterval(timer);
  }, [availableAt, now]);

  const start = useCallback((seconds: number) => {
    const startedAt = Date.now();
    setAvailableAt(startedAt + seconds * MILLISECONDS_PER_SECOND);
    setNow(startedAt);
  }, []);

  const secondsLeft = Math.max(
    NO_WAIT_SECONDS,
    Math.ceil((availableAt - now) / MILLISECONDS_PER_SECOND),
  );
  return { secondsLeft, isWaiting: secondsLeft > NO_WAIT_SECONDS, start };
}
