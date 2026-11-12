'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ErrorSummary } from '@/components/form/error-summary';
import { TextField } from '@/components/form/text-field';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import { keepAddNotice } from '@/hooks/use-cart';
import { useRequestLoginCode, useVerifyLoginCode } from '@/hooks/use-login';
import {
  NOTICE_EVENT,
  reloadSession,
  takeSessionNotice,
  type SessionNotice,
} from '@/hooks/use-session';
import { BackendErrorCode } from '@/lib/error-codes';
import { fill, requestIdOf, retryAfterSecondsOf, toAppError } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import {
  CodeSchema,
  PhoneSchema,
  type CodeInput,
  type CodeValues,
  type PhoneInput,
  type PhoneValues,
} from '@/types/auth';
import { formatPhone } from '@/utils/format';

/**
 * Login by phone code (Document 2, section 3; Document 5, section 6.4), one page for everyone
 * (D2-04): the phone number first, then the code. It never says whether an account exists. Both
 * forms use method="post" so that a tap before the scripts have loaded never puts the number or the
 * code in the address, where it would be logged.
 */
const FIELD_IDS = { phone: 'login-phone', code: 'login-code' } as const;

type PhoneForm = ReturnType<typeof useAppForm<PhoneInput, PhoneValues>>;

/** What the code step starts with, once a code has been sent. */
interface SentCode {
  phone: string;
  resendAfterSeconds: number;
  notice: string | null;
}

export function LoginForm({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const sessionNotice = useSessionNotice();
  // Owned here so the number the person typed is still there after "Change number".
  const phoneForm = useAppForm<PhoneInput, PhoneValues>(PhoneSchema, { phone: '' });
  const [sentCode, setSentCode] = useState<SentCode | null>(null);

  function changeNumber() {
    phoneForm.clearErrors();
    setSentCode(null);
  }

  if (sessionNotice === 'blocked') {
    return (
      <LoginCard>
        <h1 className="type-h2 text-ink">{messages.login.title}</h1>
        <Banner tone="error" role="alert">
          {messages.session.blocked}
        </Banner>
      </LoginCard>
    );
  }

  return (
    <div className="grid w-full gap-4">
      {sessionNotice === 'ended' ? (
        <Banner tone="info" role="status">
          {messages.session.logInAgain}
        </Banner>
      ) : null}

      <LoginCard>
        {sentCode ? (
          <CodeStep lang={lang} sentCode={sentCode} onChangeNumber={changeNumber} />
        ) : (
          <PhoneStep phoneForm={phoneForm} onCodeSent={setSentCode} />
        )}
      </LoginCard>
    </div>
  );
}

function PhoneStep({
  phoneForm,
  onCodeSent,
}: {
  phoneForm: PhoneForm;
  onCodeSent: (sentCode: SentCode) => void;
}) {
  const messages = useMessages();
  const requestLoginCode = useRequestLoginCode();
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();

  const submitPhoneNumber = phoneForm.handleSubmit(async ({ phone }) => {
    try {
      const codeSent = await requestLoginCode.mutateAsync(phone);
      onCodeSent({ phone, resendAfterSeconds: codeSent.resendAfterSeconds, notice: null });
    } catch (caughtError) {
      const error = toAppError(caughtError);

      // A code was sent a moment ago: not a mistake, so go on to the code step and show the wait.
      if (error.code === BackendErrorCode.OtpResendWait) {
        onCodeSent({
          phone,
          resendAfterSeconds: retryAfterSecondsOf(error) ?? 0,
          notice: messages.errors.codes[BackendErrorCode.OtpResendWait],
        });
        return;
      }

      applyServerError(phoneForm, error, messages, {
        codes: { [BackendErrorCode.PhoneInvalid]: 'phone' },
      });
      focusErrorSummary();
    }
  }, focusErrorSummary);

  return (
    <form
      method="post"
      className="grid gap-5"
      noValidate
      onSubmit={(event) => void submitPhoneNumber(event)}
    >
      <h1 className="type-h2 text-ink">{messages.login.title}</h1>
      <ErrorSummary
        form={phoneForm}
        fieldIds={{ phone: FIELD_IDS.phone }}
        t={messages}
        requestId={requestIdOf(requestLoginCode.error)}
        focusSignal={focusSignal}
      />
      <TextField
        form={phoneForm}
        name="phone"
        id={FIELD_IDS.phone}
        label={messages.login.phoneLabel}
        description={messages.login.phoneHelp}
        prefix="+91"
        t={messages}
        inputProps={{ type: 'tel', inputMode: 'numeric', autoComplete: 'tel-national' }}
      />
      <Button
        type="submit"
        className="w-full"
        loading={requestLoginCode.isPending}
        disabled={requestLoginCode.isPending}
      >
        {requestLoginCode.isPending ? messages.login.sending : messages.login.sendCode}
      </Button>
    </form>
  );
}

function CodeStep({
  lang,
  sentCode,
  onChangeNumber,
}: {
  lang: Locale;
  sentCode: SentCode;
  onChangeNumber: () => void;
}) {
  const messages = useMessages();
  const queryClient = useQueryClient();
  const codeForm = useAppForm<CodeInput, CodeValues>(CodeSchema, { code: '' });
  const requestLoginCode = useRequestLoginCode();
  const verifyLoginCode = useVerifyLoginCode();
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const { secondsLeft, startCountdown } = useResendCountdown(sentCode.resendAfterSeconds);
  const [notice, setNotice] = useState(sentCode.notice);
  const { phone } = sentCode;
  const busy = requestLoginCode.isPending || verifyLoginCode.isPending;

  useEffect(() => {
    document.getElementById(FIELD_IDS.code)?.focus();
  }, []);

  const submitCode = codeForm.handleSubmit(async ({ code }) => {
    try {
      const loggedIn = await verifyLoginCode.mutateAsync({ phone, code, lang });
      // The page the person goes back to says what happened to their "Add to cart" (D2-02).
      if (loggedIn.pendingAdd) keepAddNotice(loggedIn.pendingAdd);
      queryClient.clear();
      // A full page load on purpose: the next page is rendered on the server with the new cookies.
      window.location.assign(loggedIn.destination);
    } catch (caughtError) {
      const error = toAppError(caughtError);

      // The answer was lost: look at the session once and go by what is there (Document 3, section
      // 6).
      if (error.outcomeUnknown) {
        const session = await reloadSession(queryClient);
        if (session?.user) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign(`/${lang}/account`);
          return;
        }
      }

      applyServerError(codeForm, error, messages, {
        codes: {
          [BackendErrorCode.OtpInvalid]: 'code',
          [BackendErrorCode.OtpExpired]: 'code',
          [BackendErrorCode.OtpLocked]: 'code',
        },
      });
      focusErrorSummary();
    }
  }, focusErrorSummary);

  async function resendCode() {
    codeForm.clearErrors();
    try {
      const codeSent = await requestLoginCode.mutateAsync(phone);
      startCountdown(codeSent.resendAfterSeconds);
      setNotice(messages.login.codeSent);
    } catch (caughtError) {
      const error = toAppError(caughtError);
      const retryAfterSeconds = retryAfterSecondsOf(error);
      if (error.code === BackendErrorCode.OtpResendWait && retryAfterSeconds !== null) {
        startCountdown(retryAfterSeconds);
      }
      applyServerError(codeForm, error, messages);
      focusErrorSummary();
    }
  }

  const resendWaitText =
    secondsLeft === 1
      ? messages.login.resendInOne
      : fill(messages.login.resendIn, { seconds: secondsLeft });

  return (
    <form
      method="post"
      className="grid gap-5"
      noValidate
      onSubmit={(event) => void submitCode(event)}
    >
      <div className="grid gap-1">
        <h1 className="type-h2 text-ink">{messages.login.codeTitle}</h1>
        <p className="flex flex-wrap items-center gap-x-1 type-small text-ink-2">
          <span>{fill(messages.login.sentTo, { phone: displayPhone(phone) })}</span>
          <span aria-hidden="true">·</span>
          <Button
            type="button"
            variant="quiet"
            size="small"
            className="underline underline-offset-4"
            onClick={onChangeNumber}
          >
            {messages.login.changeNumber}
          </Button>
        </p>
      </div>
      <ErrorSummary
        form={codeForm}
        fieldIds={{ code: FIELD_IDS.code }}
        t={messages}
        requestId={requestIdOf(verifyLoginCode.error ?? requestLoginCode.error)}
        focusSignal={focusSignal}
      />
      <TextField
        form={codeForm}
        name="code"
        id={FIELD_IDS.code}
        label={messages.login.codeLabel}
        description={messages.login.codeHelp}
        t={messages}
        inputProps={{
          type: 'text',
          inputMode: 'numeric',
          autoComplete: 'one-time-code',
          maxLength: 12,
          className: 'tracking-[0.2em]',
        }}
      />
      {/* Always present, so a new notice is announced (Document 6, section 11). */}
      <div role="status">{notice ? <Banner tone="info">{notice}</Banner> : null}</div>
      <div className="grid gap-3">
        <Button
          type="submit"
          className="w-full"
          loading={verifyLoginCode.isPending}
          disabled={busy}
        >
          {verifyLoginCode.isPending ? messages.login.verifying : messages.login.verify}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={busy || secondsLeft > 0}
          onClick={() => void resendCode()}
        >
          {messages.login.resend}
        </Button>
        {secondsLeft > 0 ? (
          <p className="text-center type-small text-muted-foreground">{resendWaitText}</p>
        ) : null}
      </div>
    </form>
  );
}

/**
 * After a session ended, hooks/use-session.ts leaves a notice for this page: log in again, or
 * blocked.
 */
function useSessionNotice(): SessionNotice | null {
  const [sessionNotice, setSessionNotice] = useState<SessionNotice | null>(null);

  useEffect(() => {
    const readNotice = () => {
      const notice = takeSessionNotice();
      if (notice) setSessionNotice(notice);
    };
    readNotice();
    window.addEventListener(NOTICE_EVENT, readNotice);
    return () => window.removeEventListener(NOTICE_EVENT, readNotice);
  }, []);

  return sessionNotice;
}

/** Seconds until "Send code again" may be used; the wait always comes from the backend. */
function useResendCountdown(initialSeconds: number) {
  const [availableAt, setAvailableAt] = useState(() => Date.now() + initialSeconds * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (availableAt <= now) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [availableAt, now]);

  const startCountdown = useCallback((seconds: number) => {
    const startedAt = Date.now();
    setAvailableAt(startedAt + seconds * 1000);
    setNow(startedAt);
  }, []);

  const secondsLeft = Math.max(0, Math.ceil((availableAt - now) / 1000));
  return { secondsLeft, startCountdown };
}

function LoginCard({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6">
      {children}
    </div>
  );
}

/**
 * The number in the Document 6 phone format when it is a plain ten-digit number, else as it was
 * typed.
 */
function displayPhone(phone: string): string {
  const lastTenDigits = phone.replace(/\D/g, '').slice(-10);
  return lastTenDigits.length === 10 ? formatPhone(`+91${lastTenDigits}`) : phone;
}
