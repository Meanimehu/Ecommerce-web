'use client';

import { CircleCheck, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { ErrorMessage } from '@/components/common/error-message';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BackendErrorCode } from '@/lib/error-codes';
import { fill, messageFor } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { vendorApplyPath } from '@/lib/routes';
import { useVendorSubmit } from '@/features/vendor/hooks/use-vendor-submit';
import { MissingItem, stepFor, type Vendor } from '@/features/vendor/types';

/**
 * Step 4, review and submit (Document 5, section 7.1; approved Stage 5). The backend's `missing`
 * list is a checklist, each item linking to the step that fixes it; Submit stays off until it is
 * empty and the terms are accepted. The backend decides in the end. The terms text is a marked demo
 * until the owner supplies the real text (Q8-4, Q8-5): only the version label comes from the
 * backend, and it is what the submit sends. What happens on submit is in
 * `features/vendor/hooks/use-vendor-submit.ts`.
 */
const KNOWN_ITEMS: readonly string[] = Object.values(MissingItem);

interface ChecklistItem {
  key: string;
  isMissing: boolean;
}

/**
 * The known items in order, then any the backend lists that this screen does not know (shown with
 * the backend's own name). A GST certificate is listed only when the backend needs one.
 */
function checklistFor(vendor: Vendor): ChecklistItem[] {
  const knownItems = KNOWN_ITEMS.map((key) => ({ key, isMissing: vendor.missing.includes(key) }));
  const otherItems = vendor.missing
    .filter((missingItem) => !KNOWN_ITEMS.includes(missingItem))
    .map((key) => ({ key, isMissing: true }));
  return [...knownItems, ...otherItems].filter(
    (item) =>
      item.key !== MissingItem.GstCertificateDocument || item.isMissing || Boolean(vendor.gstin),
  );
}

export function ReviewStep({ lang, vendor }: { lang: Locale; vendor: Vendor }) {
  const messages = useMessages();
  const reviewMessages = messages.vendor.review;
  const vendorSubmit = useVendorSubmit({ lang, vendor });
  const { submitError, isSubmitting } = vendorSubmit;
  const missingCount = vendor.missing.length;
  const isReady = missingCount === 0;
  const missingTitle =
    missingCount === 1
      ? reviewMessages.missingOne
      : fill(reviewMessages.missingMany, { count: missingCount });
  const submitErrorText =
    submitError?.code === BackendErrorCode.TermsVersionMismatch
      ? reviewMessages.termsChanged
      : submitError && messageFor(submitError, messages);

  return (
    <section
      aria-labelledby="review-heading"
      className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="review-heading" className="type-h3 text-ink">
        {messages.vendor.steps.review}
      </h2>
      {isReady ? (
        <Banner tone="success">{reviewMessages.ready}</Banner>
      ) : (
        <Banner tone="error" title={missingTitle}>
          {reviewMessages.fixFirst}
        </Banner>
      )}
      <ul className="grid divide-y divide-line">
        {checklistFor(vendor).map((item) => (
          <ChecklistRow key={item.key} lang={lang} item={item} />
        ))}
      </ul>

      <div className="grid gap-3 rounded-1 border border-warning-edge bg-surface p-4">
        <h3 className="type-h4 text-ink">{reviewMessages.termsTitle}</h3>
        <div className="grid gap-1 rounded-1 bg-warning-fill p-3">
          <p className="type-label text-warning">{reviewMessages.termsDemo}</p>
          <p className="type-small text-ink">{reviewMessages.termsDemoBody}</p>
        </div>
        <p className="type-small text-ink-2">
          {fill(reviewMessages.termsVersion, { version: vendor.requiredTermsVersion })}
        </p>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
          <Checkbox
            checked={vendorSubmit.termsAccepted}
            onChange={(event) => vendorSubmit.setTermsAccepted(event.target.checked)}
          />
          <span>{reviewMessages.accept}</span>
        </label>
      </div>

      {submitError && submitErrorText ? (
        <ErrorMessage
          text={submitErrorText}
          requestId={submitError.requestId}
          messages={messages}
        />
      ) : null}

      <div className="grid gap-2 sm:justify-items-end">
        <Button
          type="button"
          loading={isSubmitting}
          disabled={!isReady || !vendorSubmit.termsAccepted || isSubmitting}
          onClick={vendorSubmit.submitApplication}
        >
          {isSubmitting ? reviewMessages.submitting : reviewMessages.submit}
        </Button>
        <p className="type-small text-muted-foreground">{reviewMessages.submitHelp}</p>
      </div>
    </section>
  );
}

function ChecklistRow({ lang, item }: { lang: Locale; item: ChecklistItem }) {
  const messages = useMessages();
  const reviewMessages = messages.vendor.review;
  const name = (reviewMessages.items as Record<string, string>)[item.key] ?? item.key;
  return (
    <li className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2">
      <span
        className={
          item.isMissing
            ? 'flex items-center gap-2 text-ink'
            : 'flex items-center gap-2 text-success'
        }
      >
        {item.isMissing ? (
          <TriangleAlert aria-hidden="true" className="size-4 text-warning" />
        ) : (
          <CircleCheck aria-hidden="true" className="size-4" />
        )}
        {name}
        <span className="sr-only">
          : {item.isMissing ? reviewMessages.isMissing : reviewMessages.isDone}
        </span>
      </span>
      {item.isMissing ? (
        <Link
          href={vendorApplyPath(lang, stepFor(item.key))}
          className="inline-flex min-h-11 items-center type-small underline underline-offset-4"
        >
          {reviewMessages.goToStep}
          <span className="sr-only">: {name}</span>
        </Link>
      ) : null}
    </li>
  );
}
