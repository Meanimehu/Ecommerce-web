'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Steps, type Step } from '@/components/common/steps';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { fill } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import type { Vendor } from '@/features/vendor/types';
import { AddressStep } from './address-step';
import { DetailsStep } from './details-step';
import { DocumentsStep } from './documents-step';
import { ReviewStep } from './review-step';
import { STEP_KEYS, stepFor, type StepKey } from './apply-steps';
import { isEditable, VendorStatusChip } from './vendor-status-chip';

/**
 * Become a vendor (Document 5, section 7.1; approved Stage 5): a start page with the application status, then four
 * steps, each saved as the person goes: business details, pickup address, documents, review and submit. The step is in
 * the address (?step=), so the back button and a reload keep it. Only a draft or a rejected application can be changed.
 */
export function ApplyScreen({ lang }: { lang: Locale }) {
  const t = useMessages();
  const params = useSearchParams();
  const asked = params.get('step');
  const step = (STEP_KEYS as readonly string[]).includes(asked ?? '') ? (asked as StepKey) : null;
  const mine = useMyVendor();
  const base = `/${lang}/vendor/apply`;

  let body;
  if (mine.isPending) body = <LoadingBlock messages={t} />;
  else if (mine.isError) body = <PartError error={mine.error} onRetry={() => void mine.refetch()} messages={t} />;
  else {
    const vendor = mine.data;
    if (!vendor) {
      body = step === 'details' ? <DetailsStep lang={lang} vendor={null} /> : <StatusCard lang={lang} vendor={null} />;
    } else if (!step || !isEditable(vendor.status)) {
      body = <StatusCard lang={lang} vendor={vendor} />;
    } else {
      const done: Record<StepKey, boolean> = {
        details: !vendor.missing.some((m) => stepFor(m) === 'details'),
        address: !vendor.missing.includes('pickup_address'),
        documents: !vendor.missing.some((m) => stepFor(m) === 'documents'),
        review: false,
      };
      const steps: Step[] = STEP_KEYS.map((key) => ({ key, label: t.vendor.steps[key], short: t.vendor.steps.short[key], href: `${base}?step=${key}`, done: done[key] }));
      body = (
        <div className="grid gap-5">
          <Steps steps={steps} current={step} label={t.vendor.steps.label} doneLabel={t.vendor.steps.done} />
          <p className="sr-only">{fill(t.vendor.stepOf, { step: STEP_KEYS.indexOf(step) + 1, count: STEP_KEYS.length, name: t.vendor.steps[step] })}</p>
          {step === 'details' ? <DetailsStep lang={lang} vendor={vendor} /> : null}
          {step === 'address' ? <AddressStep lang={lang} vendor={vendor} /> : null}
          {step === 'documents' ? <DocumentsStep lang={lang} vendor={vendor} /> : null}
          {step === 'review' ? <ReviewStep lang={lang} vendor={vendor} /> : null}
        </div>
      );
    }
  }

  return (
    <div className="grid max-w-[720px] gap-5">
      <div className="grid gap-2">
        <h1 className="type-h2 stitch-bottom pb-3 text-ink">{t.vendor.applyTitle}</h1>
        <p className="text-ink-2">{t.vendor.applyIntro}</p>
      </div>
      {body}
    </div>
  );
}

/** The start page: the application's status, its message, the reviewer's reason when there is one, and one way on. */
function StatusCard({ lang, vendor }: { lang: Locale; vendor: Vendor | null }) {
  const t = useMessages();
  const base = `/${lang}/vendor/apply`;
  const status = vendor?.status;
  const firstStep = vendor?.missing[0] ? stepFor(vendor.missing[0]) : 'review';
  return (
    <section aria-labelledby="status-heading" className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="status-heading" className="type-h4 text-ink">
          {t.vendor.statusTitle}
        </h2>
        {status ? <VendorStatusChip status={status} t={t} /> : null}
      </div>
      <p className="text-ink">{t.vendor.statusText[status ?? 'none']}</p>
      {vendor?.statusReason && (status === 'rejected' || status === 'suspended') ? (
        <Banner tone={status === 'rejected' ? 'error' : 'warning'} title={t.vendor.reasonTitle}>
          {/* The reviewer's own words, shown as the backend sends them. */}
          <p className="whitespace-pre-line">{vendor.statusReason}</p>
        </Banner>
      ) : null}
      <div>
        {!vendor ? (
          <Button asChild>
            <Link href={`${base}?step=details`} className="no-underline">
              {t.vendor.start}
            </Link>
          </Button>
        ) : status === 'draft' ? (
          <Button asChild>
            <Link href={`${base}?step=${firstStep}`} className="no-underline">
              {t.vendor.continue}
            </Link>
          </Button>
        ) : status === 'rejected' ? (
          <Button asChild>
            <Link href={`${base}?step=details`} className="no-underline">
              {t.vendor.editResubmit}
            </Link>
          </Button>
        ) : status === 'approved' ? (
          <Button asChild>
            <a href={`/${lang}/vendor`} className="no-underline">
              {t.vendor.goHome}
            </a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
