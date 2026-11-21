'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { fill, messageFor } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { changeCouponRequestPath, myCouponRequestsPath, myCouponsPath } from '@/lib/routes';
import { useMyProducts } from '@/features/product/hooks/use-product';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { VendorStatus } from '@/features/vendor/types';
import { useMyCouponRequest } from '@/features/coupon/hooks/use-coupons';
import { useRequestActions } from '@/features/coupon/hooks/use-request-actions';
import {
  canEditRequest,
  canWithdrawRequest,
  CouponRequestStatus,
  requestTermsShape,
  type CouponRequestView,
} from '@/features/coupon/types';
import { CouponTerms } from './coupon-terms';
import { RequestHistory } from './request-history';
import { RequestStatusChip } from './request-status-chip';

/**
 * One of the vendor's coupon requests (Document 5, section 8.2): where it stands, Dhaaga's latest
 * note, the terms proposed (with the most the vendor could pay), and its history. While it is a
 * draft or its changes were asked for, an approved vendor changes it and sends it for review; until
 * it is decided, it can be withdrawn. Once approved, the coupon made from it waits on the other tab
 * for the vendor's acceptance. What happens on a press is in `use-request-actions.ts`.
 */
const PRODUCT_NAMES_LIMIT = 100;

export function MyRequestPage({ lang, id }: { lang: Locale; id: string }) {
  const messages = useMessages();
  const requestMessages = messages.coupon.requests;
  const myRequest = useMyCouponRequest(id);
  const myVendor = useMyVendor();
  const isApproved = myVendor.data?.status === VendorStatus.Approved;
  const myProducts = useMyProducts({ limit: PRODUCT_NAMES_LIMIT });
  const actions = useRequestActions(id);
  const request = myRequest.data;
  const title = request?.coupon?.code ?? request?.proposedCode ?? requestMessages.noCode;
  const crumbs = [
    { label: requestMessages.title, href: myCouponRequestsPath(lang) },
    { label: request ? title : requestMessages.title },
  ];

  if (myRequest.isPending) {
    return (
      <Frame crumbs={crumbs}>
        <LoadingBlock messages={messages} lines={8} />
      </Frame>
    );
  }
  if (myRequest.isError || !request) {
    return (
      <Frame crumbs={crumbs}>
        <h1 className="type-h2 text-ink">{requestMessages.title}</h1>
        <PartError
          error={myRequest.error}
          onRetry={() => void myRequest.refetch()}
          messages={messages}
        />
      </Frame>
    );
  }

  const productNames = new Map(
    (myProducts.data?.items ?? []).map((product) => [product.id, product.title]),
  );
  const { actionError } = actions;

  return (
    <Frame crumbs={crumbs}>
      <div className="grid gap-2 stitch-bottom pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-h2 break-all text-ink">{title}</h1>
          <RequestStatusChip status={request.status} messages={messages} />
        </div>
        <p className="type-small text-ink-2">
          {fill(requestMessages.round, { revision: request.revision })}
        </p>
      </div>
      <RequestNotes request={request} lang={lang} />
      {actionError ? (
        <ErrorMessage
          text={messageFor(actionError, messages)}
          requestId={actionError.requestId}
          messages={messages}
        />
      ) : null}
      {isApproved ? <RequestActions lang={lang} request={request} actions={actions} /> : null}
      <section
        aria-labelledby="request-terms-heading"
        className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
      >
        <h2 id="request-terms-heading" className="type-h3 text-ink">
          {requestMessages.termsTitle}
        </h2>
        <CouponTerms coupon={requestTermsShape(request)} lang={lang} productNames={productNames} />
      </section>
      <section aria-labelledby="request-history-heading" className="grid gap-4">
        <h2 id="request-history-heading" className="type-h3 text-ink">
          {requestMessages.historyTitle}
        </h2>
        <RequestHistory
          steps={request.timeline}
          lang={lang}
          actors={requestMessages.actors}
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

/** Dhaaga's latest note, the vendor's own note and code, and the coupon made once approved. */
function RequestNotes({ request, lang }: { request: CouponRequestView; lang: Locale }) {
  const messages = useMessages();
  const requestMessages = messages.coupon.requests;
  const isApproved = request.status === CouponRequestStatus.Approved;
  const feedbackTone = request.status === CouponRequestStatus.Rejected ? 'error' : 'warning';
  return (
    <div className="grid gap-3">
      {request.feedback ? (
        <Banner tone={isApproved ? 'success' : feedbackTone} title={requestMessages.feedback}>
          <p>{request.feedback}</p>
        </Banner>
      ) : null}
      {request.coupon ? (
        <Banner tone="info">
          <p>{fill(requestMessages.couponMade, { code: request.coupon.code })}</p>
          {isApproved ? (
            <Link href={myCouponsPath(lang)} className="underline underline-offset-4">
              {requestMessages.acceptOnCoupons}
            </Link>
          ) : null}
        </Banner>
      ) : null}
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <dt className="type-small text-ink-2">{requestMessages.proposedCode}</dt>
        <dd className="text-ink">{request.proposedCode ?? requestMessages.noCode}</dd>
        {request.note ? (
          <>
            <dt className="type-small text-ink-2">{requestMessages.note}</dt>
            <dd className="text-ink">{request.note}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}

/** Change and Send for review while the vendor may edit; Withdraw until it is decided. */
function RequestActions({
  lang,
  request,
  actions,
}: {
  lang: Locale;
  request: CouponRequestView;
  actions: ReturnType<typeof useRequestActions>;
}) {
  const messages = useMessages();
  const requestMessages = messages.coupon.requests;
  const isEditable = canEditRequest(request.status);
  if (!isEditable && !canWithdrawRequest(request.status)) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {isEditable ? (
        <>
          <Button type="button" loading={actions.isSubmitting} onClick={actions.submit}>
            {requestMessages.submit}
          </Button>
          <Button asChild variant="secondary">
            <Link href={changeCouponRequestPath(lang, request.id)} className="no-underline">
              {requestMessages.change}
            </Link>
          </Button>
        </>
      ) : null}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" loading={actions.isWithdrawing}>
            {requestMessages.withdraw}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{requestMessages.withdrawTitle}</AlertDialogTitle>
            <AlertDialogDescription>{requestMessages.withdrawBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructiveConfirm" onClick={actions.withdraw}>
              {requestMessages.withdraw}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
