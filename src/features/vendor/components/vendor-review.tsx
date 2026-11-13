'use client';

import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { ReasonDialog } from '@/components/common/reason-dialog';
import { StatusChip } from '@/components/common/status-chip';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { fill, messageFor } from '@/lib/errors';
import { type Locale, type Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminVendorsPath } from '@/lib/routes';
import { formatSize } from '@/lib/uploads';
import { formatDate, formatPhone, formatTime } from '@/utils/format';
import { useVendor, vendorDocumentHref } from '@/features/vendor/hooks/use-vendor';
import { useVendorDecisions } from '@/features/vendor/hooks/use-vendor-decisions';
import {
  DocumentStatus,
  MISSING_DOCUMENT_PREFIX,
  VendorStatus,
  type AdminVendor,
  type VendorDocument,
} from '@/features/vendor/types';
import { DOCUMENT_TONES } from './document-row';
import { VendorStatusChip } from './vendor-status-chip';

/**
 * One vendor application for review (Document 5, section 8.3; approved Stage 5): the application,
 * its addresses and documents (each opened through our server, then approved or rejected with a
 * reason), and the decision: approve, reject (with a reason), suspend (with a reason) and
 * unsuspend, offered by status. What each decision does is in
 * `features/vendor/hooks/use-vendor-decisions.ts`.
 */
const REASON_MAX_LENGTH = 500;

/** A document can be decided on only while its application is with the reviewer or approved. */
const STATUSES_FOR_DOCUMENT_DECISIONS: readonly VendorStatus[] = [
  VendorStatus.Submitted,
  VendorStatus.Approved,
];

/** Statuses in which the next move is the vendor's, not the reviewer's. */
const STATUSES_WAITING_FOR_VENDOR: readonly VendorStatus[] = [
  VendorStatus.Draft,
  VendorStatus.Rejected,
];

type VendorDecisions = ReturnType<typeof useVendorDecisions>;

export function VendorReview({ lang, id }: { lang: Locale; id: string }) {
  const messages = useMessages();
  const vendor = useVendor(id);
  return (
    <div className="grid max-w-[960px] gap-5">
      <Breadcrumbs
        label={messages.nav.breadcrumbs}
        items={[
          { label: messages.adminVendors.title, href: adminVendorsPath(lang) },
          { label: vendor.data?.displayName ?? messages.adminVendors.application },
        ]}
      />
      <VendorReviewContent lang={lang} vendor={vendor} />
    </div>
  );
}

function VendorReviewContent({
  lang,
  vendor,
}: {
  lang: Locale;
  vendor: ReturnType<typeof useVendor>;
}) {
  const messages = useMessages();
  if (vendor.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (vendor.isError) {
    return (
      <PartError error={vendor.error} onRetry={() => void vendor.refetch()} messages={messages} />
    );
  }
  return <Review lang={lang} vendor={vendor.data} />;
}

function Review({ lang, vendor }: { lang: Locale; vendor: AdminVendor }) {
  const messages = useMessages();
  const reviewMessages = messages.adminVendors;
  const decisions = useVendorDecisions(vendor.id);
  const notGiven = <span className="text-muted-foreground">{reviewMessages.notGiven}</span>;
  const sellerTypeLabel = vendor.sellerType
    ? ((messages.vendor.sellerTypes as Record<string, string>)[vendor.sellerType] ??
      vendor.sellerType)
    : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{vendor.displayName}</h1>
        <VendorStatusChip status={vendor.status} messages={messages} />
      </div>
      {vendor.statusReason ? (
        <Banner
          tone={vendor.status === VendorStatus.Suspended ? 'warning' : 'error'}
          title={reviewMessages.statusReason}
        >
          <p className="whitespace-pre-line">{vendor.statusReason}</p>
        </Banner>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={reviewMessages.application}>
          <dl className="grid gap-2">
            <Row label={messages.vendor.fields.legalName}>{vendor.legalName}</Row>
            <Row label={messages.vendor.fields.displayName}>{vendor.displayName}</Row>
            <Row label={messages.vendor.fields.gstin}>{vendor.gstin ?? notGiven}</Row>
            <Row label={messages.vendor.fields.sellerType}>{sellerTypeLabel ?? notGiven}</Row>
            <Row label={messages.vendor.fields.contactEmail}>{vendor.contactEmail ?? notGiven}</Row>
            <Row label={reviewMessages.ownerPhone}>
              {vendor.owner.phone ? (
                <span className="tabular-nums">{formatPhone(vendor.owner.phone)}</span>
              ) : (
                notGiven
              )}
            </Row>
            <Row label={reviewMessages.submittedAt}>
              {vendor.submittedAt
                ? `${formatDate(vendor.submittedAt, lang)}, ${formatTime(vendor.submittedAt, lang)}`
                : notGiven}
            </Row>
            <Row label={reviewMessages.terms}>{vendor.termsAcceptedVersion ?? notGiven}</Row>
          </dl>
        </Card>
        <Card title={reviewMessages.addresses}>
          <AddressList vendor={vendor} />
        </Card>
      </div>

      <Card title={reviewMessages.documents}>
        {vendor.documents.length ? (
          <ul className="grid divide-y divide-line">
            {vendor.documents.map((vendorDocument) => (
              <DocumentReviewRow
                key={vendorDocument.id}
                lang={lang}
                vendor={vendor}
                vendorDocument={vendorDocument}
                decisions={decisions}
              />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{reviewMessages.noDocuments}</p>
        )}
      </Card>

      <Card title={reviewMessages.decision}>
        <DecisionError decisions={decisions} />
        <div className="flex flex-wrap gap-3">
          <VendorDecisionButtons vendor={vendor} decisions={decisions} />
        </div>
        <p className="type-small text-muted-foreground">
          {STATUSES_WAITING_FOR_VENDOR.includes(vendor.status)
            ? reviewMessages.waitingForVendor
            : reviewMessages.decisionHelp}
        </p>
      </Card>
    </>
  );
}

function AddressList({ vendor }: { vendor: AdminVendor }) {
  const messages = useMessages();
  if (!vendor.addresses.length) {
    return <p className="text-muted-foreground">{messages.adminVendors.noAddresses}</p>;
  }
  return (
    <ul className="grid gap-3">
      {vendor.addresses.map((address) => (
        <li key={address.id} className="grid gap-0.5">
          <p className="type-label text-ink">{messages.vendor.address.types[address.type]}</p>
          <p className="text-ink">
            {[address.line1, address.line2, address.city, address.state, address.pincode]
              .filter(Boolean)
              .join(', ')}
          </p>
          <p className="type-small text-ink-2 tabular-nums">{formatPhone(address.contactPhone)}</p>
        </li>
      ))}
    </ul>
  );
}

function DocumentReviewRow({
  lang,
  vendor,
  vendorDocument,
  decisions,
}: {
  lang: Locale;
  vendor: AdminVendor;
  vendorDocument: VendorDocument;
  decisions: VendorDecisions;
}) {
  const messages = useMessages();
  const reviewMessages = messages.adminVendors;
  const label =
    (messages.vendor.documents.types as Record<string, string>)[vendorDocument.type] ??
    vendorDocument.type;
  const canDecide =
    vendorDocument.status === DocumentStatus.Pending &&
    STATUSES_FOR_DOCUMENT_DECISIONS.includes(vendor.status);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="grid min-w-0 gap-1">
        <p className="font-medium text-ink">
          {label}
          {vendorDocument.onRecord ? (
            <span className="font-normal text-ink-2"> ({reviewMessages.onRecord})</span>
          ) : null}
        </p>
        <p className="truncate type-small text-ink-2">
          {vendorDocument.fileName} · {formatSize(vendorDocument.sizeBytes)} ·{' '}
          {formatDate(vendorDocument.createdAt, lang)}
        </p>
        <div>
          <StatusChip
            tone={DOCUMENT_TONES[vendorDocument.status]}
            label={messages.vendor.documents.status[vendorDocument.status]}
          />
        </div>
        {vendorDocument.rejectReason ? (
          <p className="type-small text-ink">
            {fill(messages.vendor.documents.rejectedReason, {
              reason: vendorDocument.rejectReason,
            })}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="quiet" size="small">
          <a href={vendorDocumentHref(vendor.id, vendorDocument.id)} target="_blank" rel="noopener">
            {reviewMessages.viewFile}
            <span className="sr-only">: {label}</span>
          </a>
        </Button>
        {canDecide ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="small"
              disabled={decisions.isDeciding}
              onClick={() => decisions.approveDocument(vendorDocument.id)}
            >
              {reviewMessages.approveDoc}
              <span className="sr-only">: {label}</span>
            </Button>
            <ReasonDialog
              messages={messages}
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  size="small"
                  disabled={decisions.isDeciding}
                >
                  {reviewMessages.rejectDoc}
                  <span className="sr-only">: {label}</span>
                </Button>
              }
              title={fill(reviewMessages.rejectDocTitle, { document: label })}
              body={reviewMessages.rejectDocBody}
              label={reviewMessages.reasonLabel}
              confirmLabel={reviewMessages.rejectDocConfirm}
              maxLength={REASON_MAX_LENGTH}
              onConfirm={decisions.rejectDocument(vendorDocument.id)}
            />
          </>
        ) : null}
      </div>
    </li>
  );
}

function DecisionError({ decisions }: { decisions: VendorDecisions }) {
  const messages = useMessages();
  const { decisionError, outstandingItems } = decisions;
  if (!decisionError) return null;
  if (outstandingItems) {
    return (
      <Banner tone="error" role="alert" title={messages.adminVendors.outstandingTitle}>
        <ul className="list-disc ps-5">
          {outstandingItems.map((item) => (
            <li key={item}>{outstandingLabel(item, messages)}</li>
          ))}
        </ul>
      </Banner>
    );
  }
  return (
    <ErrorMessage
      text={messageFor(decisionError, messages)}
      requestId={decisionError.requestId}
      messages={messages}
    />
  );
}

/** The decisions the vendor's status allows: approve or reject, suspend, or unsuspend. */
function VendorDecisionButtons({
  vendor,
  decisions,
}: {
  vendor: AdminVendor;
  decisions: VendorDecisions;
}) {
  const messages = useMessages();
  const reviewMessages = messages.adminVendors;

  switch (vendor.status) {
    case VendorStatus.Submitted:
      return (
        <>
          <Button
            type="button"
            loading={decisions.isApprovingVendor}
            disabled={decisions.isDeciding}
            onClick={decisions.approveVendor}
          >
            <Check aria-hidden="true" />
            {reviewMessages.approve}
          </Button>
          <ReasonDialog
            messages={messages}
            trigger={
              <Button type="button" variant="destructive" disabled={decisions.isDeciding}>
                {reviewMessages.reject}
              </Button>
            }
            title={fill(reviewMessages.rejectTitle, { name: vendor.displayName })}
            body={reviewMessages.rejectBody}
            label={reviewMessages.reasonLabel}
            confirmLabel={reviewMessages.rejectConfirm}
            maxLength={REASON_MAX_LENGTH}
            onConfirm={decisions.rejectVendor}
          />
        </>
      );
    case VendorStatus.Approved:
      return (
        <ReasonDialog
          messages={messages}
          trigger={
            <Button type="button" variant="destructive" disabled={decisions.isDeciding}>
              {reviewMessages.suspend}
            </Button>
          }
          title={fill(reviewMessages.suspendTitle, { name: vendor.displayName })}
          body={reviewMessages.suspendBody}
          label={reviewMessages.reasonLabel}
          confirmLabel={reviewMessages.suspendConfirm}
          maxLength={REASON_MAX_LENGTH}
          onConfirm={decisions.suspendVendor}
        />
      );
    case VendorStatus.Suspended:
      return (
        <Button
          type="button"
          variant="secondary"
          loading={decisions.isChangingVendor}
          onClick={decisions.unsuspendVendor}
        >
          {reviewMessages.unsuspend}
        </Button>
      );
    default:
      return null;
  }
}

const MISSING_DOCUMENT_PATTERN = new RegExp(
  `^${MISSING_DOCUMENT_PREFIX}([a-z_]+)(:file_not_clean)?$`,
);

/**
 * Words for each item the backend lists as lacking (area-2-vendors.md, POST
 * /admin/vendors/{id}/approve).
 */
function outstandingLabel(item: string, messages: Messages): string {
  const outstandingMessages = messages.adminVendors.outstanding;
  const known = (outstandingMessages as Record<string, string>)[item];
  if (known) return known;
  const match = MISSING_DOCUMENT_PATTERN.exec(item);
  if (!match) return item;
  const [, documentType = '', fileNotClean] = match;
  const documentLabel =
    (messages.vendor.documents.types as Record<string, string>)[documentType] ?? documentType;
  const template = fileNotClean ? outstandingMessages.fileNotClean : outstandingMessages.document;
  return fill(template, { document: documentLabel });
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid content-start gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <h2 className="type-h3 text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3">
      <dt className="type-small text-ink-2">{label}</dt>
      <dd className="text-ink break-words">{children}</dd>
    </div>
  );
}
