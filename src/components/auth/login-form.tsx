'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ErrorSummary } from '@/components/form/error-summary';
import { applyServerError, useAppForm } from '@/hooks/use-app-form';
import { TextField } from '@/components/form/text-field';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { useRequestCode, useVerify } from '@/hooks/use-login';
import { NOTICE_EVENT, reloadSession, takeSessionNotice, type SessionNotice } from '@/hooks/use-session';
import { AppError, fill } from '@/lib/errors';
import { getMessages, type Locale } from '@/lib/i18n';
import { formatPhone } from '@/utils/format';
import { CodeSchema, PhoneSchema, type CodeInput, type PhoneInput } from '@/types/auth';

/**
 * Login by phone code (Document 2, section 3; Document 5, section 6.4). One login page for everyone (D2-04).
 * Phone first, then one code field with autocomplete="one-time-code" (D6-24). The wait before "Send code again" comes
 * from the backend. It never says whether an account exists. Forms: React Hook Form with Zod (D-04); server data:
 * TanStack Query (D-02). The forms use method="post" so that, before the scripts have loaded (or without them), a
 * tap on a button never puts the phone number or code in the address (it would land in history and server logs).
 */
const IDS = { phone: 'login-phone', code: 'login-code' } as const;
const asAppError = (error: unknown): AppError => (error instanceof AppError ? error : new AppError({ code: 'NETWORK', status: 0 }));

export function LoginForm({ lang }: { lang: Locale }) {
  const t = getMessages(lang);
  const queryClient = useQueryClient();
  const phoneForm = useAppForm<PhoneInput, { phone: string }>(PhoneSchema, { phone: '' });
  const codeForm = useAppForm<CodeInput, { code: string }>(CodeSchema, { code: '' });
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [phoneFocus, setPhoneFocus] = useState(0);
  const [codeFocus, setCodeFocus] = useState(0);

  // After a session ended, hooks/use-session.ts leaves a notice for this page: "Please log in again", or the blocked message.
  const [sessionNotice, setSessionNotice] = useState<SessionNotice | null>(null);
  useEffect(() => {
    const read = () => {
      const notice = takeSessionNotice();
      if (notice) setSessionNotice(notice);
    };
    read();
    window.addEventListener(NOTICE_EVENT, read);
    return () => window.removeEventListener(NOTICE_EVENT, read);
  }, []);

  useEffect(() => {
    if (resendAt <= now) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAt, now]);

  useEffect(() => {
    if (step === 'code') document.getElementById(IDS.code)?.focus();
  }, [step]);

  const waitSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const startWait = useCallback((seconds: number) => {
    const at = Date.now();
    setResendAt(at + seconds * 1000);
    setNow(at);
  }, []);

  const requestCode = useRequestCode();
  const verify = useVerify();

  const onPhone = phoneForm.handleSubmit(
    (values) => {
      requestCode.mutate(values.phone, {
        onSuccess: (answer) => {
          setPhone(values.phone);
          startWait(answer.resendAfterSeconds);
          setNotice(null);
          setStep('code');
        },
        onError: (raw) => {
          const error = asAppError(raw);
          if (error.code === 'OTP_RESEND_WAIT') {
            // A code was sent a moment ago: go to the code step and show the wait (not a mistake by the person).
            setPhone(values.phone);
            const seconds = Number(error.details?.retryAfterSeconds);
            if (Number.isFinite(seconds)) startWait(seconds);
            setNotice(t.errors.codes.OTP_RESEND_WAIT);
            setStep('code');
            return;
          }
          applyServerError(phoneForm, error, t, { codes: { PHONE_INVALID: 'phone' } });
          setPhoneFocus((n) => n + 1);
        },
      });
    },
    () => setPhoneFocus((n) => n + 1),
  );

  const onCode = codeForm.handleSubmit(
    (values) => {
      verify.mutate({ phone, code: values.code, lang }, {
        onSuccess: (answer) => {
          queryClient.clear();
          // A full page load on purpose: the next page is rendered on the server with the new cookies.
          window.location.assign(answer.destination);
        },
        onError: async (raw) => {
          const error = asAppError(raw);
          if (error.outcomeUnknown) {
            // Unknown outcome: look at the session once, and go by what is there (Document 3, section 6).
            const answer = await reloadSession(queryClient);
            if (answer?.user) {
              // A full page load on purpose: the account page is rendered on the server with the new cookies.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign(`/${lang}/account`);
              return;
            }
          }
          applyServerError(codeForm, error, t, { codes: { OTP_INVALID: 'code', OTP_EXPIRED: 'code', OTP_LOCKED: 'code' } });
          setCodeFocus((n) => n + 1);
        },
      });
    },
    () => setCodeFocus((n) => n + 1),
  );

  const resend = () => {
    codeForm.clearErrors();
    requestCode.mutate(phone, {
      onSuccess: (answer) => {
        startWait(answer.resendAfterSeconds);
        setNotice(t.login.codeSent);
      },
      onError: (raw) => {
        const error = asAppError(raw);
        const seconds = Number(error.details?.retryAfterSeconds);
        if (error.code === 'OTP_RESEND_WAIT' && Number.isFinite(seconds)) startWait(seconds);
        applyServerError(codeForm, error, t);
        setCodeFocus((n) => n + 1);
      },
    });
  };

  const busy = requestCode.isPending || verify.isPending;

  // Account blocked: the message instead of the login form's normal flow (Document 2, section 4).
  if (sessionNotice === 'blocked') {
    return (
      <Card>
        <h1 className="type-h2 text-ink">{t.login.title}</h1>
        <Banner tone="error" role="alert">
          {t.session.blocked}
        </Banner>
      </Card>
    );
  }

  return (
    <div className="grid w-full gap-4">
      {sessionNotice === 'ended' ? (
        <Banner tone="info" role="status">
          {t.session.logInAgain}
        </Banner>
      ) : null}

      <Card>
        {step === 'phone' ? (
          <form method="post" className="grid gap-5" noValidate onSubmit={(event) => void onPhone(event)}>
            <h1 className="type-h2 text-ink">{t.login.title}</h1>
            <ErrorSummary form={phoneForm} fieldIds={{ phone: IDS.phone }} t={t} requestId={asRequestId(requestCode.error)} focusSignal={phoneFocus} />
            <TextField
              form={phoneForm}
              name="phone"
              id={IDS.phone}
              label={t.login.phoneLabel}
              description={t.login.phoneHelp}
              prefix="+91"
              t={t}
              inputProps={{ type: 'tel', inputMode: 'numeric', autoComplete: 'tel-national' }}
            />
            <Button type="submit" className="w-full" loading={requestCode.isPending} disabled={busy}>
              {requestCode.isPending ? t.login.sending : t.login.sendCode}
            </Button>
          </form>
        ) : (
          <form method="post" className="grid gap-5" noValidate onSubmit={(event) => void onCode(event)}>
            <div className="grid gap-1">
              <h1 className="type-h2 text-ink">{t.login.codeTitle}</h1>
              <p className="flex flex-wrap items-center gap-x-1 type-small text-ink-2">
                <span>{fill(t.login.sentTo, { phone: displayPhone(phone) })}</span>
                <span aria-hidden="true">·</span>
                <Button
                  type="button"
                  variant="quiet"
                  size="small"
                  className="underline underline-offset-4"
                  onClick={() => {
                    codeForm.reset();
                    phoneForm.clearErrors();
                    setNotice(null);
                    setStep('phone');
                  }}
                >
                  {t.login.changeNumber}
                </Button>
              </p>
            </div>
            <ErrorSummary
              form={codeForm}
              fieldIds={{ code: IDS.code }}
              t={t}
              requestId={asRequestId(verify.error ?? requestCode.error)}
              focusSignal={codeFocus}
            />
            <TextField
              form={codeForm}
              name="code"
              id={IDS.code}
              label={t.login.codeLabel}
              description={t.login.codeHelp}
              t={t}
              inputProps={{ type: 'text', inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 12, className: 'tracking-[0.2em]' }}
            />
            {/* Always present, so a new notice is announced (Document 6, section 11, status messages). */}
            <div role="status">{notice ? <Banner tone="info">{notice}</Banner> : null}</div>
            <div className="grid gap-3">
              <Button type="submit" className="w-full" loading={verify.isPending} disabled={busy}>
                {verify.isPending ? t.login.verifying : t.login.verify}
              </Button>
              <Button type="button" variant="secondary" className="w-full" disabled={busy || waitSeconds > 0} onClick={resend}>
                {t.login.resend}
              </Button>
              {waitSeconds > 0 ? (
                <p className="text-center type-small text-muted-foreground">
                  {waitSeconds === 1 ? t.login.resendInOne : fill(t.login.resendIn, { seconds: waitSeconds })}
                </p>
              ) : null}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

/** The card the login steps sit on (approved Stage 5): surface, hairline, radius-1. */
function Card({ children }: { children: ReactNode }) {
  return <div className="grid w-full gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6">{children}</div>;
}

/** The number as it was typed, shown in the Document 6 phone format when it is a plain ten-digit number. */
function displayPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? formatPhone(`+91${digits}`) : value;
}

function asRequestId(error: unknown): string | undefined {
  return error instanceof AppError ? error.requestId : undefined;
}
