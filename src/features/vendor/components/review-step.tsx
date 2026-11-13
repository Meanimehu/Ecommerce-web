'use client';

import { CircleCheck, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ErrorMessage } from '@/components/common/error-message';
import { useToast } from '@/components/common/toast';
import { useSubmitVendor } from '@/features/vendor/hooks/use-vendor';
import { fill, messageFor, toAppError, type AppError } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { stepFor, type Vendor } from '@/features/vendor/types';

/**
 * Step 4, review and submit (Document 5, section 7.1; approved Stage 5). The backend's `missing` list is a checklist,
 * each item linking to the step that fixes it; Submit stays off until it is empty and the terms are accepted. The backend
 * decides in the end. The terms text is a marked demo until the owner supplies the real text (Q8-4, Q8-5): only the
 * version label comes from the backend, and it is what the submit sends.
 */
const KNOWN = ['seller_type', 'contact_email', 'pickup_address', 'document:pan', 'document:gst_certificate'] as const;

export function ReviewStep({ lang, vendor }: { lang: Locale; vendor: Vendor }) {
  const t = useMessages();
  const router = useRouter();
  const toast = useToast();
  const submit = useSubmitVendor();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const base = `/${lang}/vendor/apply`;
  const missing = vendor.missing;
  // Items the backend lists that this screen does not know are still shown (with the backend's own name).
  const checklist = [...KNOWN.map((key) => ({ key, missing: missing.includes(key) })), ...missing.filter((m) => !(KNOWN as readonly string[]).includes(m)).map((key) => ({ key, missing: true }))]
    // A GST certificate is listed only when the backend needs one.
    .filter((item) => item.key !== 'document:gst_certificate' || item.missing || Boolean(vendor.gstin));
  const ready = missing.length === 0;

  const onSubmit = () => {
    setError(null);
    submit.mutate(vendor.requiredTermsVersion, {
      onSuccess: () => {
        toast(t.vendor.review.submitted);
        router.push(base);
      },
      onError: (raw) => {
        const appError = toAppError(raw);
        if (appError.code === 'TERMS_VERSION_MISMATCH') setAccepted(false);
        setError(appError);
      },
    });
  };

  return (
    <section aria-labelledby="review-heading" className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <h2 id="review-heading" className="type-h3 text-ink">
        {t.vendor.steps.review}
      </h2>
      {ready ? (
        <Banner tone="success">{t.vendor.review.ready}</Banner>
      ) : (
        <Banner tone="error" title={missing.length === 1 ? t.vendor.review.missingOne : fill(t.vendor.review.missingMany, { count: missing.length })}>
          {t.vendor.review.fixFirst}
        </Banner>
      )}
      <ul className="grid divide-y divide-line">
        {checklist.map((item) => {
          const name = (t.vendor.review.items as Record<string, string>)[item.key] ?? item.key;
          return (
            <li key={item.key} className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2">
              <span className={item.missing ? 'flex items-center gap-2 text-ink' : 'flex items-center gap-2 text-success'}>
                {item.missing ? <TriangleAlert aria-hidden="true" className="size-4 text-warning" /> : <CircleCheck aria-hidden="true" className="size-4" />}
                {name}
                <span className="sr-only">: {item.missing ? t.vendor.review.isMissing : t.vendor.review.isDone}</span>
              </span>
              {item.missing ? (
                <Link href={`${base}?step=${stepFor(item.key)}`} className="inline-flex min-h-11 items-center type-small underline underline-offset-4">
                  {t.vendor.review.goToStep}
                  <span className="sr-only">: {name}</span>
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="grid gap-3 rounded-1 border border-warning-edge bg-surface p-4">
        <h3 className="type-h4 text-ink">{t.vendor.review.termsTitle}</h3>
        <div className="grid gap-1 rounded-1 bg-warning-fill p-3">
          <p className="type-label text-warning">{t.vendor.review.termsDemo}</p>
          <p className="type-small text-ink">{t.vendor.review.termsDemoBody}</p>
        </div>
        <p className="type-small text-ink-2">{fill(t.vendor.review.termsVersion, { version: vendor.requiredTermsVersion })}</p>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
          <Checkbox checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
          <span>{t.vendor.review.accept}</span>
        </label>
      </div>

      {error ? <ErrorMessage text={error.code === 'TERMS_VERSION_MISMATCH' ? t.vendor.review.termsChanged : messageFor(error, t)} requestId={error.requestId} messages={t} /> : null}

      <div className="grid gap-2 sm:justify-items-end">
        <Button type="button" loading={submit.isPending} disabled={!ready || !accepted || submit.isPending} onClick={onSubmit}>
          {submit.isPending ? t.vendor.review.submitting : t.vendor.review.submit}
        </Button>
        <p className="type-small text-muted-foreground">{t.vendor.review.submitHelp}</p>
      </div>
    </section>
  );
}
