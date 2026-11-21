'use client';

import Link from 'next/link';
import { lazy, Suspense, type ReactNode } from 'react';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { ViewOnlyChip } from '@/components/common/view-only-chip';
import { Banner } from '@/components/ui/banner';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminCouponPath, adminCouponRequestsPath, adminVendorPath } from '@/lib/routes';
import { useStaffCouponRequest } from '@/features/coupon/hooks/use-coupons';
import { CouponRequestStatus, requestTermsShape } from '@/features/coupon/types';
import { CouponTerms } from './coupon-terms';
import { RequestHistory } from './request-history';
import { StaffRequestStatusChip } from './staff-request-status-chip';

/**
 * One coupon request, for staff (Document 5, section 8.3): its vendor, the vendor's note, the
 * terms proposed with the most the vendor could pay, the latest note to the vendor, the coupon made
 * from it, and its history. Admin and marketing decide a submitted request, except one they made
 * themselves; finance and support read, with "View only".
 */
const StaffRequestDecisions = lazy(() =>
  import('./staff-request-decisions').then((module) => ({
    default: module.StaffRequestDecisions,
  })),
);

export interface StaffRequestAccess {
  canDecide: boolean;
  canOpenVendor: boolean;
  canOpenCoupons: boolean;
  /** The person looking, so a request they made is not offered to them to decide. */
  viewerId: string;
}

export function StaffRequestPage({
  lang,
  id,
  access,
}: {
  lang: Locale;
  id: string;
  access: StaffRequestAccess;
}) {
  const messages = useMessages();
  const staffMessages = messages.coupon.staffRequests;
  const requestMessages = messages.coupon.requests;
  const staffRequest = useStaffCouponRequest(id);
  const request = staffRequest.data;
  const title = request?.coupon?.code ?? request?.proposedCode ?? requestMessages.noCode;
  const crumbs = [
    { label: staffMessages.title, href: adminCouponRequestsPath(lang) },
    { label: request ? title : staffMessages.title },
  ];

  if (staffRequest.isPending) {
    return (
      <Frame crumbs={crumbs}>
        <LoadingBlock messages={messages} lines={8} />
      </Frame>
    );
  }
  if (staffRequest.isError || !request) {
    return (
      <Frame crumbs={crumbs}>
        <h1 className="type-h2 text-ink">{staffMessages.title}</h1>
        <PartError
          error={staffRequest.error}
          onRetry={() => void staffRequest.refetch()}
          messages={messages}
        />
      </Frame>
    );
  }

  const isWaiting = request.status === CouponRequestStatus.Submitted;
  const isOwn = request.requestedBy === access.viewerId;

  return (
    <Frame crumbs={crumbs}>
      <div className="grid gap-2 stitch-bottom pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-h2 break-all text-ink">{title}</h1>
          <StaffRequestStatusChip status={request.status} messages={messages} />
          {access.canDecide ? null : <ViewOnlyChip label={staffMessages.viewOnly} />}
        </div>
        <p className="type-small text-ink-2">
          {fill(requestMessages.round, { revision: request.revision })}
        </p>
      </div>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <dt className="type-small text-ink-2">{staffMessages.vendor}</dt>
        <dd className="break-all text-ink">
          {access.canOpenVendor ? (
            <Link
              href={adminVendorPath(lang, request.vendorId)}
              className="underline underline-offset-4"
            >
              {request.vendorId}
            </Link>
          ) : (
            request.vendorId
          )}
        </dd>
        <dt className="type-small text-ink-2">{requestMessages.proposedCode}</dt>
        <dd className="text-ink">{request.proposedCode ?? requestMessages.noCode}</dd>
        {request.note ? (
          <>
            <dt className="type-small text-ink-2">{staffMessages.vendorNote}</dt>
            <dd className="text-ink">{request.note}</dd>
          </>
        ) : null}
        {request.feedback ? (
          <>
            <dt className="type-small text-ink-2">{staffMessages.feedback}</dt>
            <dd className="text-ink">{request.feedback}</dd>
          </>
        ) : null}
      </dl>
      {request.coupon && access.canOpenCoupons ? (
        <p>
          <Link
            href={adminCouponPath(lang, request.coupon.id)}
            className="underline underline-offset-4"
          >
            {fill(staffMessages.openCoupon, { code: request.coupon.code })}
          </Link>
        </p>
      ) : null}
      {access.canDecide && isWaiting ? (
        <section aria-labelledby="request-decide-heading" className="grid gap-3">
          <h2 id="request-decide-heading" className="type-h3 text-ink">
            {staffMessages.decideTitle}
          </h2>
          {isOwn ? (
            <Banner tone="info">{staffMessages.ownRequest}</Banner>
          ) : (
            <Suspense fallback={null}>
              <StaffRequestDecisions request={request} />
            </Suspense>
          )}
        </section>
      ) : null}
      <section
        aria-labelledby="request-terms-heading"
        className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
      >
        <h2 id="request-terms-heading" className="type-h3 text-ink">
          {staffMessages.termsTitle}
        </h2>
        <CouponTerms coupon={requestTermsShape(request)} lang={lang} />
      </section>
      <section aria-labelledby="request-history-heading" className="grid gap-4">
        <h2 id="request-history-heading" className="type-h3 text-ink">
          {requestMessages.historyTitle}
        </h2>
        <RequestHistory
          steps={request.timeline}
          lang={lang}
          actors={staffMessages.actors}
          messages={messages}
        />
      </section>
    </Frame>
  );
}

function Frame({
  crumbs,
  children,
}: {
  crumbs: { label: string; href?: string }[];
  children: ReactNode;
}) {
  const messages = useMessages();
  return (
    <div className="grid max-w-[960px] gap-6">
      <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
      {children}
    </div>
  );
}
