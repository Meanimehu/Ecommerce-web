'use client';

import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { ViewOnlyChip } from '@/components/common/view-only-chip';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminCouponRequestPath, adminCouponRequestsPath } from '@/lib/routes';
import { pageNumber, withQuery } from '@/utils/url';
import { useStaffCouponRequests } from '@/features/coupon/hooks/use-coupons';
import {
  COUPON_REQUEST_STATUSES,
  isCouponRequestStatus,
  isIdShape,
  type CouponRequest,
} from '@/features/coupon/types';
import { discountText, whenText } from './coupon-text';
import { StaffRequestStatusChip } from './staff-request-status-chip';

/**
 * Every vendor's coupon requests, for staff (Document 5, section 8.3): filters by status and
 * vendor, kept in the address (only those set); a vendor id with the wrong shape is marked and
 * nothing is asked. Admin and marketing decide on each request's page; finance and support read,
 * with "View only". The backend names a request's vendor by id only.
 */
const PAGE_SIZE = 20;

export function StaffRequestList({ lang, canDecide }: { lang: Locale; canDecide: boolean }) {
  const messages = useMessages();
  const staffMessages = messages.coupon.staffRequests;
  const router = useRouter();
  const searchParams = useSearchParams();
  const askedStatus = searchParams.get('status');
  const status = isCouponRequestStatus(askedStatus) ? askedStatus : '';
  const vendorId = (searchParams.get('vendorId') ?? '').trim();
  const isVendorWrong = vendorId !== '' && !isIdShape(vendorId);
  const page = pageNumber(searchParams.get('page'));
  const filters = { status, vendorId };
  const staffRequests = useStaffCouponRequests(
    { status: status || undefined, vendorId: vendorId || undefined, page, limit: PAGE_SIZE },
    !isVendorWrong,
  );
  const listPath = adminCouponRequestsPath(lang);
  const hasFilters = Boolean(status || vendorId);

  /** With scripts, only the filters that are set go into the address; without, the form still works. */
  function showResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = new FormData(event.currentTarget);
    const valueOf = (name: string) => String(chosen.get(name) ?? '').trim();
    router.push(
      adminCouponRequestsPath(lang, { status: valueOf('status'), vendorId: valueOf('vendorId') }),
    );
  }

  const columns: Column<CouponRequest>[] = [
    {
      key: 'code',
      header: staffMessages.columns.code,
      lead: true,
      cell: (request) => (
        <Link
          href={adminCouponRequestPath(lang, request.id)}
          className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          {request.coupon?.code ?? request.proposedCode ?? messages.coupon.requests.noCode}
        </Link>
      ),
    },
    {
      key: 'status',
      header: staffMessages.columns.status,
      lead: true,
      cell: (request) => <StaffRequestStatusChip status={request.status} messages={messages} />,
    },
    {
      key: 'vendor',
      header: staffMessages.columns.vendor,
      cell: (request) => <span className="type-small break-all">{request.vendorId}</span>,
    },
    {
      key: 'discount',
      header: staffMessages.columns.discount,
      cell: (request) => discountText(request.terms, messages),
    },
    {
      key: 'sent',
      header: staffMessages.columns.sent,
      cell: (request) => whenText(request.submittedAt, lang, messages.coupon.requests.notSent),
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{staffMessages.title}</h1>
        {canDecide ? null : <ViewOnlyChip label={staffMessages.viewOnly} />}
      </div>
      <p className="max-w-[72ch] text-ink-2">{staffMessages.intro}</p>
      <form
        method="get"
        action={listPath}
        onSubmit={showResults}
        noValidate
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[240px_minmax(0,1fr)_auto] lg:items-start"
      >
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{staffMessages.filters.status}</span>
          <Select name="status" defaultValue={status}>
            <option value="">{staffMessages.filters.all}</option>
            {COUPON_REQUEST_STATUSES.map((value) => (
              <option key={value} value={value}>
                {staffMessages.status[value]}
              </option>
            ))}
          </Select>
        </label>
        <div className="grid content-start gap-1.5">
          <label htmlFor="requests-vendor" className="type-label text-ink">
            {staffMessages.filters.vendorId}
          </label>
          <Input
            id="requests-vendor"
            name="vendorId"
            defaultValue={vendorId}
            maxLength={36}
            autoComplete="off"
            aria-invalid={isVendorWrong || undefined}
            aria-describedby={isVendorWrong ? 'requests-vendor-error' : undefined}
          />
          {isVendorWrong ? (
            <span id="requests-vendor-error" className="type-small text-error">
              {staffMessages.filters.badId}
            </span>
          ) : null}
        </div>
        <div className="flex gap-2 lg:mt-[26px]">
          <Button type="submit" variant="secondary">
            {staffMessages.filters.show}
          </Button>
          {hasFilters ? (
            <Button asChild variant="quiet">
              <a href={listPath}>{staffMessages.filters.clear}</a>
            </Button>
          ) : null}
        </div>
      </form>
      {isVendorWrong ? (
        <Banner tone="warning" title={staffMessages.fixFilters} />
      ) : (
        <RequestResults
          staffRequests={staffRequests}
          columns={columns}
          page={page}
          isFiltered={hasFilters}
          hrefFor={(pageToShow) =>
            withQuery(listPath, { ...filters, page: pageToShow === 1 ? undefined : pageToShow })
          }
        />
      )}
    </div>
  );
}

function RequestResults({
  staffRequests,
  columns,
  page,
  isFiltered,
  hrefFor,
}: {
  staffRequests: ReturnType<typeof useStaffCouponRequests>;
  columns: Column<CouponRequest>[];
  page: number;
  isFiltered: boolean;
  hrefFor: (page: number) => string;
}) {
  const messages = useMessages();
  const staffMessages = messages.coupon.staffRequests;
  if (staffRequests.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (staffRequests.isError) {
    return (
      <PartError
        error={staffRequests.error}
        onRetry={() => void staffRequests.refetch()}
        messages={messages}
      />
    );
  }
  if (staffRequests.data.items.length === 0) {
    return (
      <StateBlock
        icon={ClipboardList}
        title={isFiltered ? staffMessages.emptyFiltered : staffMessages.empty}
        text={staffMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={staffRequests.data.items}
        columns={columns}
        rowKey={(request) => request.id}
        caption={staffMessages.title}
      />
      <Pagination
        page={page}
        limit={staffRequests.data.limit}
        total={staffRequests.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
