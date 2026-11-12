'use client';

import { useState, type ReactNode } from 'react';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { TextField } from '@/components/form/text-field';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import {
  useCodeStep,
  usePhoneStep,
  type PhoneStepState,
  type SentCode,
} from '@/hooks/use-login-form';
import { SessionNotice, useSessionNotice } from '@/hooks/use-session';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { formatPhone, isSingular } from '@/utils/format';

/**
 * The login screen (Document 5, section 6.4): one page for everyone (D2-04), the phone number
 * first, then the code. It only draws; what happens on submit is in hooks/use-login-form.ts.
 */
const FIELD_IDS = { phone: 'login-phone', code: 'login-code' } as const;

const INDIAN_MOBILE_DIGITS = 10;

export function LoginForm({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const sessionNotice = useSessionNotice();
  const [sentCode, setSentCode] = useState<SentCode | null>(null);
  // Here, not inside PhoneStep, so the typed number is still there after "Change number".
  const phoneStep = usePhoneStep({ onCodeSent: setSentCode });

  function changeNumber() {
    phoneStep.form.clearErrors();
    setSentCode(null);
  }

  if (sessionNotice === SessionNotice.Blocked) {
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
      {sessionNotice === SessionNotice.Ended ? (
        <Banner tone="info" role="status">
          {messages.session.logInAgain}
        </Banner>
      ) : null}

      <LoginCard>
        {sentCode ? (
          <CodeStep lang={lang} sentCode={sentCode} onChangeNumber={changeNumber} />
        ) : (
          <PhoneStep phoneStep={phoneStep} />
        )}
      </LoginCard>
    </div>
  );
}

function PhoneStep({ phoneStep }: { phoneStep: PhoneStepState }) {
  const messages = useMessages();
  const { form, sendCode, showValidationErrors, focusSignal, isSending, requestId } = phoneStep;

  return (
    <Form className="grid gap-5" onSubmit={form.handleSubmit(sendCode, showValidationErrors)}>
      <h1 className="type-h2 text-ink">{messages.login.title}</h1>
      <ErrorSummary
        form={form}
        fieldIds={{ phone: FIELD_IDS.phone }}
        t={messages}
        requestId={requestId}
        focusSignal={focusSignal}
      />
      <TextField
        form={form}
        name="phone"
        id={FIELD_IDS.phone}
        label={messages.login.phoneLabel}
        description={messages.login.phoneHelp}
        prefix="+91"
        t={messages}
        inputProps={{ type: 'tel', inputMode: 'numeric', autoComplete: 'tel-national' }}
      />
      <Button type="submit" className="w-full" loading={isSending} disabled={isSending}>
        {isSending ? messages.login.sending : messages.login.sendCode}
      </Button>
    </Form>
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
  const {
    form,
    phone,
    notice,
    verifyCode,
    resendCode,
    showValidationErrors,
    focusSignal,
    secondsUntilResend,
    mustWaitToResend,
    isVerifying,
    isBusy,
    requestId,
  } = useCodeStep({ lang, sentCode });

  const resendWaitText = isSingular(secondsUntilResend)
    ? messages.login.resendInOne
    : fill(messages.login.resendIn, { seconds: secondsUntilResend });

  return (
    <Form className="grid gap-5" onSubmit={form.handleSubmit(verifyCode, showValidationErrors)}>
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
        form={form}
        fieldIds={{ code: FIELD_IDS.code }}
        t={messages}
        requestId={requestId}
        focusSignal={focusSignal}
      />
      <TextField
        form={form}
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
        <Button type="submit" className="w-full" loading={isVerifying} disabled={isBusy}>
          {isVerifying ? messages.login.verifying : messages.login.verify}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={isBusy || mustWaitToResend}
          onClick={resendCode}
        >
          {messages.login.resend}
        </Button>
        {mustWaitToResend ? (
          <p className="text-center type-small text-muted-foreground">{resendWaitText}</p>
        ) : null}
      </div>
    </Form>
  );
}

function LoginCard({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6">
      {children}
    </div>
  );
}

/** The number in the Document 6 phone format when it is ten digits, else as it was typed. */
function displayPhone(phone: string): string {
  const lastTenDigits = phone.replace(/\D/g, '').slice(-INDIAN_MOBILE_DIGITS);
  const isFullNumber = lastTenDigits.length === INDIAN_MOBILE_DIGITS;
  return isFullNumber ? formatPhone(`+91${lastTenDigits}`) : phone;
}
