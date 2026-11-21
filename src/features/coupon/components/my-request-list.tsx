'use client';

import { Ticket } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myCouponRequestPath, myCouponRequestsPath, newCouponRequestPath } from '@/lib/routes';
import { pageNumber, withQuery } from '@/utils/url';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { VendorStatus } from '@/features/vendor/types';
import { useMyCouponRequests } from '@/features/coupon/hooks/use-coupons';
import {
  COUPON_REQUEST_STATUSES,
  isCouponRequestStatus,
  type CouponRequest,
} from '@/features/coupon/types';
import { CouponTab, CouponTabs } from './coupon-tabs';
import { discountText, whenText } from './coupon-text';
import { RequestStatusChip } from './request-status-chip';

/**
 * The vendor's coupon requests (Document 5, section 8.2), the second tab of Coupons: newest first,
 * a status filter in the address, each opening its terms and history. Only an approved vendor makes
 * a new one; the Vendor area's one banner says why to the others.
 */
const PAGE_SIZE = 20;

export function MyRequestList({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const requestMessages = messages.coupon.requests;
  const termMessages = messages.coupon.terms;
  const router = useRouter();
  const searchParams = useSearchParams();
  const askedStatus = searchParams.get('status');
  const status = isCouponRequestStatus(askedStatus) ? askedStatus : '';
  const page = pageNumber(searchParams.get('page'));
  const myRequests = useMyCouponRequests({ status: status || undefined, page, limit: PAGE_SIZE });
  const myVendor = useMyVendor();
  const isApproved = myVendor.data?.status === VendorStatus.Approved;
  const listPath = myCouponRequestsPath(lang);

  /** With scripts, only a chosen status goes into the address; without, the form still works. */
  function showResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = String(new FormData(event.currentTarget).get('status') ?? '');
    router.push(withQuery(listPath, { status: chosen }));
  }

  const columns: Column<CouponRequest>[] = [
    {
      key: 'code',
      header: requestMessages.columns.code,
      lead: true,
      cell: (request) => (
        <Link
          href={myCouponRequestPath(lang, request.id)}
          className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          {request.coupon?.code ?? request.proposedCode ?? requestMessages.noCode}
        </Link>
      ),
    },
    {
      key: 'status',
      header: requestMessages.columns.status,
      lead: true,
      cell: (request) => <RequestStatusChip status={request.status} messages={messages} />,
    },
    {
      key: 'discount',
      header: requestMessages.columns.discount,
      cell: (request) => discountText(request.terms, messages),
    },
    {
      key: 'dates',
      header: requestMessages.columns.dates,
      cell: (request) =>
        fill(messages.coupon.staff.dates, {
          start: whenText(request.terms.startsAt, lang, termMessages.atOnce),
          end: whenText(request.terms.endsAt, lang, termMessages.noEnd),
        }),
    },
    {
      key: 'sent',
      header: requestMessages.columns.sent,
      cell: (request) => whenText(request.submittedAt, lang, requestMessages.notSent),
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="type-h2 text-ink">{messages.coupon.vendor.title}</h1>
        {isApproved ? (
          <Button asChild>
            <Link href={newCouponRequestPath(lang)} className="no-underline">
              {requestMessages.add}
            </Link>
          </Button>
        ) : null}
      </div>
      <CouponTabs lang={lang} current={CouponTab.Requests} messages={messages} />
      <p className="max-w-[72ch] text-ink-2">{requestMessages.intro}</p>
      <form
        method="get"
        action={listPath}
        onSubmit={showResults}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{requestMessages.filters.status}</span>
          <Select name="status" defaultValue={status} className="lg:h-10">
            <option value="">{requestMessages.filters.all}</option>
            {COUPON_REQUEST_STATUSES.map((value) => (
              <option key={value} value={value}>
                {requestMessages.status[value]}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" variant="secondary">
          {requestMessages.filters.show}
        </Button>
      </form>
      <RequestResults
        myRequests={myRequests}
        columns={columns}
        page={page}
        isFiltered={Boolean(status)}
        hrefFor={(pageToShow) =>
          withQuery(listPath, { status, page: pageToShow === 1 ? undefined : pageToShow })
        }
      />
    </div>
  );
}

function RequestResults({
  myRequests,
  columns,
  page,
  isFiltered,
  hrefFor,
}: {
  myRequests: ReturnType<typeof useMyCouponRequests>;
  columns: Column<CouponRequest>[];
  page: number;
  isFiltered: boolean;
  hrefFor: (page: number) => string;
}) {
  const messages = useMessages();
  const requestMessages = messages.coupon.requests;
  if (myRequests.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (myRequests.isError) {
    return (
      <PartError
        error={myRequests.error}
        onRetry={() => void myRequests.refetch()}
        messages={messages}
      />
    );
  }
  if (myRequests.data.items.length === 0) {
    return (
      <StateBlock
        icon={Ticket}
        title={isFiltered ? requestMessages.emptyFiltered : requestMessages.empty}
        text={requestMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={myRequests.data.items}
        columns={columns}
        rowKey={(request) => request.id}
        caption={requestMessages.title}
      />
      <Pagination
        page={page}
        limit={myRequests.data.limit}
        total={myRequests.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
