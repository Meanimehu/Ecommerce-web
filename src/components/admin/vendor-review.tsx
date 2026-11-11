'use client';

import { Check } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { ReasonDialog } from '@/components/common/reason-dialog';
import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import { useToast } from '@/components/common/toast';
import { VendorStatusChip } from '@/components/vendor/vendor-status';
import { useVendor, useVendorDecision, vendorDocumentHref } from '@/hooks/use-vendor';
import { fill, messageFor, toAppError, type AppError } from '@/lib/errors';
import { type Locale, type Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { formatSize } from '@/lib/uploads';
import { formatDate, formatPhone, formatTime } from '@/utils/format';
import type { AdminVendor, VendorDocument } from '@/types/vendor';

/**
 * One vendor application for review (Document 5, section 8.3; approved Stage 5): the application, its addresses and
 * documents (each opened through our server, then approved or rejected with a reason), and the decision: approve,
 * reject (with a reason), suspend (with a reason) and unsuspend, offered by status. The backend decides whether a
 * change is allowed; when approval is refused it lists what is lacking, and the screen shows that list.
 */
const DOC_TONE: Record<VendorDocument['status'], ChipTone> = { pending: 'info', approved: 'success', rejected: 'error' };

export function VendorReview({ lang, id }: { lang: Locale; id: string }) {
  const t = useMessages();
  const vendor = useVendor(id);
  const base = `/${lang}/admin/vendors`;
  return (
    <div className="grid max-w-[960px] gap-5">
      <Breadcrumbs label={t.nav.breadcrumbs} items={[{ label: t.adminVendors.title, href: base }, { label: vendor.data?.displayName ?? t.adminVendors.application }]} />
      {vendor.isPending ? (
        <LoadingBlock t={t} lines={6} />
      ) : vendor.isError ? (
        <PartError error={vendor.error} onRetry={() => void vendor.refetch()} t={t} />
      ) : (
        <Review lang={lang} vendor={vendor.data} />
      )}
    </div>
  );
}

function Review({ lang, vendor }: { lang: Locale; vendor: AdminVendor }) {
  const t = useMessages();
  const toast = useToast();
  const decide = useVendorDecision(vendor.id);
  const [error, setError] = useState<AppError | null>(null);
  const a = t.adminVendors;
  const none = <span className="text-muted-foreground">{a.notGiven}</span>;

  const run = (decision: string, success: string, extra: { docId?: string; reason?: string } = {}) =>
    decide.mutateAsync({ decision, ...extra }).then(
      () => {
        setError(null);
        toast(success);
      },
      (raw: unknown) => {
        // A refusal with a reason is shown in its own dialog; the others here.
        if (extra.reason === undefined) setError(toAppError(raw));
        throw raw;
      },
    );
  const quiet = (promise: Promise<unknown>) => void promise.catch(() => undefined);
  const outstanding = error?.code === 'VENDOR_DOCUMENTS_PENDING' && Array.isArray(error.details?.outstanding) ? (error.details.outstanding as string[]) : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{vendor.displayName}</h1>
        <VendorStatusChip status={vendor.status} t={t} />
      </div>
      {vendor.statusReason ? (
        <Banner tone={vendor.status === 'suspended' ? 'warning' : 'error'} title={a.statusReason}>
          <p className="whitespace-pre-line">{vendor.statusReason}</p>
        </Banner>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={a.application}>
          <dl className="grid gap-2">
            <Row label={t.vendor.fields.legalName}>{vendor.legalName}</Row>
            <Row label={t.vendor.fields.displayName}>{vendor.displayName}</Row>
            <Row label={t.vendor.fields.gstin}>{vendor.gstin ?? none}</Row>
            <Row label={t.vendor.fields.sellerType}>{vendor.sellerType ? ((t.vendor.sellerTypes as Record<string, string>)[vendor.sellerType] ?? vendor.sellerType) : none}</Row>
            <Row label={t.vendor.fields.contactEmail}>{vendor.contactEmail ?? none}</Row>
            <Row label={a.ownerPhone}>{vendor.owner.phone ? <span className="tabular-nums">{formatPhone(vendor.owner.phone)}</span> : none}</Row>
            <Row label={a.submittedAt}>{vendor.submittedAt ? `${formatDate(vendor.submittedAt, lang)}, ${formatTime(vendor.submittedAt, lang)}` : none}</Row>
            <Row label={a.terms}>{vendor.termsAcceptedVersion ?? none}</Row>
          </dl>
        </Card>
        <Card title={a.addresses}>
          {vendor.addresses.length ? (
            <ul className="grid gap-3">
              {vendor.addresses.map((address) => (
                <li key={address.id} className="grid gap-0.5">
                  <p className="type-label text-ink">{t.vendor.address.types[address.type]}</p>
                  <p className="text-ink">{[address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean).join(', ')}</p>
                  <p className="type-small text-ink-2 tabular-nums">{formatPhone(address.contactPhone)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">{a.noAddresses}</p>
          )}
        </Card>
      </div>

      <Card title={a.documents}>
        {vendor.documents.length ? (
          <ul className="grid divide-y divide-line">
            {vendor.documents.map((doc) => {
              const label = (t.vendor.documents.types as Record<string, string>)[doc.type] ?? doc.type;
              return (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="grid min-w-0 gap-1">
                    <p className="font-medium text-ink">
                      {label}
                      {doc.onRecord ? <span className="font-normal text-ink-2"> ({a.onRecord})</span> : null}
                    </p>
                    <p className="truncate type-small text-ink-2">
                      {doc.fileName} · {formatSize(doc.sizeBytes)} · {formatDate(doc.createdAt, lang)}
                    </p>
                    <div>
                      <StatusChip tone={DOC_TONE[doc.status]} label={t.vendor.documents.status[doc.status]} />
                    </div>
                    {doc.rejectReason ? <p className="type-small text-ink">{fill(t.vendor.documents.rejectedReason, { reason: doc.rejectReason })}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="quiet" size="small">
                      <a href={vendorDocumentHref(vendor.id, doc.id)} target="_blank" rel="noopener">
                        {a.viewFile}
                        <span className="sr-only">: {label}</span>
                      </a>
                    </Button>
                    {doc.status === 'pending' && (vendor.status === 'submitted' || vendor.status === 'approved') ? (
                      <>
                        <Button type="button" variant="secondary" size="small" disabled={decide.isPending} onClick={() => quiet(run('approve', a.docApproved, { docId: doc.id }))}>
                          {a.approveDoc}
                          <span className="sr-only">: {label}</span>
                        </Button>
                        <ReasonDialog
                          t={t}
                          trigger={
                            <Button type="button" variant="destructive" size="small" disabled={decide.isPending}>
                              {a.rejectDoc}
                              <span className="sr-only">: {label}</span>
                            </Button>
                          }
                          title={fill(a.rejectDocTitle, { document: label })}
                          body={a.rejectDocBody}
                          label={a.reasonLabel}
                          confirmLabel={a.rejectDocConfirm}
                          maxLength={500}
                          onConfirm={(reason) => run('reject', a.docRejected, { docId: doc.id, reason })}
                        />
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground">{a.noDocuments}</p>
        )}
      </Card>

      <Card title={a.decision}>
        {error ? (
          outstanding ? (
            <Banner tone="error" role="alert" title={a.outstandingTitle}>
              <ul className="list-disc ps-5">
                {outstanding.map((item) => (
                  <li key={item}>{outstandingLabel(item, t)}</li>
                ))}
              </ul>
            </Banner>
          ) : (
            <ErrorMessage text={messageFor(error, t)} requestId={error.requestId} t={t} />
          )
        ) : null}
        <div className="flex flex-wrap gap-3">
          {vendor.status === 'submitted' ? (
            <>
              <Button type="button" loading={decide.isPending && decide.variables?.decision === 'approve' && !decide.variables.docId} disabled={decide.isPending} onClick={() => quiet(run('approve', a.approved))}>
                <Check aria-hidden="true" />
                {a.approve}
              </Button>
              <ReasonDialog
                t={t}
                trigger={
                  <Button type="button" variant="destructive" disabled={decide.isPending}>
                    {a.reject}
                  </Button>
                }
                title={fill(a.rejectTitle, { name: vendor.displayName })}
                body={a.rejectBody}
                label={a.reasonLabel}
                confirmLabel={a.rejectConfirm}
                maxLength={500}
                onConfirm={(reason) => run('reject', a.rejected, { reason })}
              />
            </>
          ) : null}
          {vendor.status === 'approved' ? (
            <ReasonDialog
              t={t}
              trigger={
                <Button type="button" variant="destructive" disabled={decide.isPending}>
                  {a.suspend}
                </Button>
              }
              title={fill(a.suspendTitle, { name: vendor.displayName })}
              body={a.suspendBody}
              label={a.reasonLabel}
              confirmLabel={a.suspendConfirm}
              maxLength={500}
              onConfirm={(reason) => run('suspend', a.suspended, { reason })}
            />
          ) : null}
          {vendor.status === 'suspended' ? (
            <Button type="button" variant="secondary" loading={decide.isPending} onClick={() => quiet(run('unsuspend', a.unsuspended))}>
              {a.unsuspend}
            </Button>
          ) : null}
        </div>
        <p className="type-small text-muted-foreground">{vendor.status === 'draft' || vendor.status === 'rejected' ? a.waitingForVendor : a.decisionHelp}</p>
      </Card>
    </>
  );
}

/** Words for each item the backend lists as lacking (area-2-vendors.md, POST /admin/vendors/{id}/approve). */
function outstandingLabel(item: string, t: Messages): string {
  const known = (t.adminVendors.outstanding as Record<string, string>)[item];
  if (known) return known;
  const match = /^document:([a-z_]+)(:file_not_clean)?$/.exec(item);
  if (match) {
    const doc = (t.vendor.documents.types as Record<string, string>)[match[1] ?? ''] ?? match[1] ?? item;
    return fill(match[2] ? t.adminVendors.outstanding.fileNotClean : t.adminVendors.outstanding.document, { document: doc });
  }
  return item;
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
