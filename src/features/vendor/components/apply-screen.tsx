'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Steps, type Step } from '@/components/common/steps';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { fill } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { vendorApplyPath, vendorHomePath } from '@/lib/routes';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import {
  APPLY_STEPS,
  ApplyStep,
  isApplyStep,
  isEditable,
  MissingItem,
  stepFor,
  VendorStatus,
  type Vendor,
} from '@/features/vendor/types';
import { AddressStep } from './address-step';
import { DetailsStep } from './details-step';
import { DocumentsStep } from './documents-step';
import { ReviewStep } from './review-step';
import { VendorStatusChip } from './vendor-status-chip';

/**
 * Become a vendor (Document 5, section 7.1; approved Stage 5): a start page with the application
 * status, then four steps, each saved as the person goes: business details, pickup address,
 * documents, review and submit. The step is in the address (?step=), so the back button and a
 * reload keep it. Only a draft or a rejected application can be changed.
 */
export function ApplyScreen({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const searchParams = useSearchParams();
  const askedStep = searchParams.get('step');
  const step = isApplyStep(askedStep) ? askedStep : null;
  const myVendor = useMyVendor();

  return (
    <div className="grid max-w-[720px] gap-5">
      <div className="grid gap-2">
        <h1 className="type-h2 stitch-bottom pb-3 text-ink">{messages.vendor.applyTitle}</h1>
        <p className="text-ink-2">{messages.vendor.applyIntro}</p>
      </div>
      <ApplyContent lang={lang} step={step} myVendor={myVendor} />
    </div>
  );
}

function ApplyContent({
  lang,
  step,
  myVendor,
}: {
  lang: Locale;
  step: ApplyStep | null;
  myVendor: ReturnType<typeof useMyVendor>;
}) {
  const messages = useMessages();

  if (myVendor.isPending) return <LoadingBlock messages={messages} />;
  if (myVendor.isError) {
    return (
      <PartError
        error={myVendor.error}
        onRetry={() => void myVendor.refetch()}
        messages={messages}
      />
    );
  }

  const vendor = myVendor.data;
  if (!vendor) {
    // Nobody has applied yet: only the first step can start an application.
    return step === ApplyStep.Details ? (
      <DetailsStep lang={lang} vendor={null} />
    ) : (
      <StatusCard lang={lang} vendor={null} />
    );
  }
  if (!step || !isEditable(vendor.status)) return <StatusCard lang={lang} vendor={vendor} />;
  return <ApplySteps lang={lang} vendor={vendor} step={step} />;
}

function ApplySteps({ lang, vendor, step }: { lang: Locale; vendor: Vendor; step: ApplyStep }) {
  const messages = useMessages();
  const isMissingFor = (applyStep: ApplyStep) =>
    vendor.missing.some((missingItem) => stepFor(missingItem) === applyStep);

  const done: Record<ApplyStep, boolean> = {
    [ApplyStep.Details]: !isMissingFor(ApplyStep.Details),
    [ApplyStep.Address]: !vendor.missing.includes(MissingItem.PickupAddress),
    [ApplyStep.Documents]: !isMissingFor(ApplyStep.Documents),
    [ApplyStep.Review]: false,
  };
  const steps: Step[] = APPLY_STEPS.map((applyStep) => ({
    key: applyStep,
    label: messages.vendor.steps[applyStep],
    short: messages.vendor.steps.short[applyStep],
    href: vendorApplyPath(lang, applyStep),
    done: done[applyStep],
  }));
  const stepPosition = fill(messages.vendor.stepOf, {
    step: APPLY_STEPS.indexOf(step) + 1,
    count: APPLY_STEPS.length,
    name: messages.vendor.steps[step],
  });

  return (
    <div className="grid gap-5">
      <Steps
        steps={steps}
        current={step}
        label={messages.vendor.steps.label}
        doneLabel={messages.vendor.steps.done}
      />
      <p className="sr-only">{stepPosition}</p>
      {step === ApplyStep.Details ? <DetailsStep lang={lang} vendor={vendor} /> : null}
      {step === ApplyStep.Address ? <AddressStep lang={lang} vendor={vendor} /> : null}
      {step === ApplyStep.Documents ? <DocumentsStep lang={lang} vendor={vendor} /> : null}
      {step === ApplyStep.Review ? <ReviewStep lang={lang} vendor={vendor} /> : null}
    </div>
  );
}

/** The statuses whose reason from the reviewer is shown on the start page. */
const STATUSES_WITH_REASON: readonly VendorStatus[] = [
  VendorStatus.Rejected,
  VendorStatus.Suspended,
];

/**
 * The start page: the application's status, its message, the reviewer's reason when there is one,
 * and one way on.
 */
function StatusCard({ lang, vendor }: { lang: Locale; vendor: Vendor | null }) {
  const messages = useMessages();
  const status = vendor?.status;
  const showsReason = Boolean(
    vendor?.statusReason && status && STATUSES_WITH_REASON.includes(status),
  );

  return (
    <section
      aria-labelledby="status-heading"
      className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="status-heading" className="type-h4 text-ink">
          {messages.vendor.statusTitle}
        </h2>
        {status ? <VendorStatusChip status={status} messages={messages} /> : null}
      </div>
      <p className="text-ink">{messages.vendor.statusText[status ?? 'none']}</p>
      {showsReason ? (
        <Banner
          tone={status === VendorStatus.Rejected ? 'error' : 'warning'}
          title={messages.vendor.reasonTitle}
        >
          {/* The reviewer's own words, shown as the backend sends them. */}
          <p className="whitespace-pre-line">{vendor?.statusReason}</p>
        </Banner>
      ) : null}
      <div>
        <StatusCardAction lang={lang} vendor={vendor} />
      </div>
    </section>
  );
}

/**
 * The one way on from the start page, by status; none while the application is with the reviewer.
 */
function StatusCardAction({ lang, vendor }: { lang: Locale; vendor: Vendor | null }) {
  const messages = useMessages();

  if (!vendor) {
    return (
      <StepLink href={vendorApplyPath(lang, ApplyStep.Details)} label={messages.vendor.start} />
    );
  }

  switch (vendor.status) {
    case VendorStatus.Draft: {
      const firstStep = vendor.missing[0] ? stepFor(vendor.missing[0]) : ApplyStep.Review;
      return <StepLink href={vendorApplyPath(lang, firstStep)} label={messages.vendor.continue} />;
    }
    case VendorStatus.Rejected:
      return (
        <StepLink
          href={vendorApplyPath(lang, ApplyStep.Details)}
          label={messages.vendor.editResubmit}
        />
      );
    case VendorStatus.Approved:
      return (
        <Button asChild>
          <a href={vendorHomePath(lang)} className="no-underline">
            {messages.vendor.goHome}
          </a>
        </Button>
      );
    default:
      return null;
  }
}

function StepLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild>
      <Link href={href} className="no-underline">
        {label}
      </Link>
    </Button>
  );
}
