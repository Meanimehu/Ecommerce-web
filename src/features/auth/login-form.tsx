'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSession, send } from '@/lib/client/api';
import { AppError, fill, messageFor } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { ErrorMessage } from '../common/error-message';

/**
 * Login by phone code (Document 2, section 3; Document 5, section 6.4). One login page for everyone (D2-04). Phone
 * first, then one code field with autocomplete="one-time-code". The wait before "Send code again" comes from the
 * backend. It never says whether an account exists.
 */
type Step = 'phone' | 'code';

export function LoginForm({ lang }: { lang: Locale }) {
  const t = getMessages(lang);
  const queryClient = useQueryClient();
  const ids = { phone: useId(), phoneHelp: useId(), code: useId(), codeHelp: useId(), error: useId() };
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const codeRef = useRef<HTMLInputElement>(null);

  // Fetch the anti-forgery token for this page; clear a session the backend has already ended.
  useEffect(() => {
    getSession().catch(async (problem: unknown) => {
      const handle = problem instanceof AppError ? problem.details?.handle : undefined;
      if (typeof handle === 'string') await send('/api/session/clear', { handle }).catch(() => undefined);
      if (problem instanceof AppError && problem.code === 'USER_BLOCKED') setError(problem);
    });
  }, []);

  useEffect(() => {
    if (resendAt <= now) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAt, now]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const waitSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  async function requestCode(again: boolean) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const answer = await send<{ resendAfterSeconds: number }>('/api/auth/code', { phone });
      setResendAt(Date.now() + answer.resendAfterSeconds * 1000);
      setNow(Date.now());
      setStep('code');
      if (again) setNotice(t.login.codeSent);
    } catch (problem) {
      const failure = problem instanceof AppError ? problem : new AppError({ code: 'NETWORK', status: 0 });
      if (failure.code === 'OTP_RESEND_WAIT') {
        const seconds = Number(failure.details?.retryAfterSeconds);
        if (Number.isFinite(seconds)) setResendAt(Date.now() + seconds * 1000);
        setNow(Date.now());
        setStep('code');
      }
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const answer = await send<{ destination: string }>('/api/auth/verify', { phone, code, lang });
      queryClient.clear();
      window.location.assign(answer.destination);
    } catch (problem) {
      setError(problem instanceof AppError ? problem : new AppError({ code: 'NETWORK', status: 0 }));
      setBusy(false);
    }
  }

  const errorText = error ? messageFor(error, t) : null;
  const fieldError = error && ['PHONE_INVALID', 'OTP_INVALID', 'OTP_EXPIRED', 'OTP_LOCKED'].includes(error.code);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.login.title}</h1>
        <p className="text-sm">{t.login.intro}</p>
      </div>

      {step === 'phone' ? (
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) void requestCode(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={ids.phone}>{t.login.phoneLabel}</Label>
            <Input
              id={ids.phone}
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              aria-describedby={`${ids.phoneHelp}${fieldError ? ` ${ids.error}` : ''}`}
              aria-invalid={fieldError ? true : undefined}
              required
            />
            <p id={ids.phoneHelp} className="text-sm">
              {t.login.phoneHelp}
            </p>
          </div>
          {errorText ? (
            <div id={ids.error}>
              <ErrorMessage text={errorText} requestId={error?.requestId} t={t} />
            </div>
          ) : null}
          <Button type="submit" disabled={busy || phone.trim() === ''}>
            {busy ? t.login.sending : t.login.sendCode}
          </Button>
        </form>
      ) : (
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) void verify();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={ids.code}>{t.login.codeLabel}</Label>
            <Input
              ref={codeRef}
              id={ids.code}
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={12}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\s/g, ''))}
              aria-describedby={`${ids.codeHelp}${fieldError ? ` ${ids.error}` : ''}`}
              aria-invalid={fieldError ? true : undefined}
              required
            />
            <p id={ids.codeHelp} className="text-sm">
              {fill(t.login.codeHelp, { phone })}
            </p>
          </div>
          {errorText ? (
            <div id={ids.error}>
              <ErrorMessage text={errorText} requestId={error?.requestId} t={t} />
            </div>
          ) : null}
          <p role="status" className="text-sm">
            {notice}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy || code === ''}>
              {busy ? t.login.verifying : t.login.verify}
            </Button>
            <Button type="button" variant="outline" disabled={busy || waitSeconds > 0} onClick={() => void requestCode(true)}>
              {t.login.resend}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setStep('phone');
                setCode('');
                setError(null);
                setNotice(null);
              }}
            >
              {t.login.changeNumber}
            </Button>
          </div>
          {waitSeconds > 0 ? <p className="text-sm">{fill(t.login.resendIn, { seconds: waitSeconds })}</p> : null}
        </form>
      )}
    </div>
  );
}
