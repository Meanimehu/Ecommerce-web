'use client';

import { Ticket } from 'lucide-react';
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
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminCouponPath, adminCouponsPath, newAdminCouponPath } from '@/lib/routes';
import { pageNumber, withQuery } from '@/utils/url';
import { useStaffCoupons } from '@/features/coupon/hooks/use-coupons';
import { COUPON_STATUSES, isCouponStatus, isIdShape, type Coupon } from '@/features/coupon/types';
import { CouponStatusChip } from './coupon-status-chip';
import { discountText, usedText, whenText } from './coupon-text';

/**
 * Every coupon, for staff (Document 5, section 8.3): filters by status, code and vendor, kept in
 * the address (only those set); a vendor id with the wrong shape is marked and nothing is asked.
 * Admin and marketing add a coupon; finance and support read it, with "View only".
 */
const PAGE_SIZE = 20;
const CODE_MAX_LENGTH = 20;

export function StaffCouponList({ lang, canChange }: { lang: Locale; canChange: boolean }) {
  const messages = useMessages();
  const couponMessages = messages.coupon;
  const staffMessages = couponMessages.staff;
  const termMessages = couponMessages.terms;
  const router = useRouter();
  const searchParams = useSearchParams();
  const askedStatus = searchParams.get('status');
  const status = isCouponStatus(askedStatus) ? askedStatus : '';
  const code = (searchParams.get('code') ?? '').trim();
  const vendorId = (searchParams.get('vendorId') ?? '').trim();
  const isVendorWrong = vendorId !== '' && !isIdShape(vendorId);
  const page = pageNumber(searchParams.get('page'));
  const filters = { status, code, vendorId };
  const staffCoupons = useStaffCoupons(
    {
      status: status || undefined,
      code: code || undefined,
      vendorId: vendorId || undefined,
      page,
      limit: PAGE_SIZE,
    },
    !isVendorWrong,
  );
  const listPath = adminCouponsPath(lang);
  const hasFilters = Boolean(status || code || vendorId);

  /** With scripts, only the filters that are set go into the address; without, the form still works. */
  function showResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = new FormData(event.currentTarget);
    const valueOf = (name: string) => String(chosen.get(name) ?? '').trim();
    router.push(
      adminCouponsPath(lang, {
        status: valueOf('status'),
        code: valueOf('code'),
        vendorId: valueOf('vendorId'),
      }),
    );
  }

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: staffMessages.columns.code,
      lead: true,
      cell: (coupon) => (
        <Link
          href={adminCouponPath(lang, coupon.id)}
          className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          {coupon.code}
        </Link>
      ),
    },
    {
      key: 'status',
      header: staffMessages.columns.status,
      lead: true,
      cell: (coupon) => <CouponStatusChip status={coupon.status} messages={messages} />,
    },
    {
      key: 'discount',
      header: staffMessages.columns.discount,
      cell: (coupon) => discountText(coupon, messages),
    },
    {
      key: 'fundedBy',
      header: staffMessages.columns.fundedBy,
      cell: (coupon) => couponMessages.fundedBy[coupon.fundedBy],
    },
    {
      key: 'dates',
      header: staffMessages.columns.dates,
      cell: (coupon) =>
        fill(staffMessages.dates, {
          start: whenText(coupon.startsAt, lang, termMessages.atOnce),
          end: whenText(coupon.endsAt, lang, termMessages.noEnd),
        }),
    },
    {
      key: 'used',
      header: staffMessages.columns.used,
      numeric: true,
      cell: (coupon) => usedText(coupon, messages),
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-h2 text-ink">{staffMessages.title}</h1>
          {canChange ? null : <ViewOnlyChip label={staffMessages.viewOnly} />}
        </div>
        {canChange ? (
          <Button asChild>
            <Link href={newAdminCouponPath(lang)} className="no-underline">
              {staffMessages.add}
            </Link>
          </Button>
        ) : null}
      </div>
      <p className="max-w-[72ch] text-ink-2">{staffMessages.intro}</p>
      <form
        method="get"
        action={listPath}
        onSubmit={showResults}
        noValidate
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[200px_200px_minmax(0,1fr)_auto] lg:items-start"
      >
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{staffMessages.filters.status}</span>
          <Select name="status" defaultValue={status}>
            <option value="">{staffMessages.filters.all}</option>
            {COUPON_STATUSES.map((value) => (
              <option key={value} value={value}>
                {couponMessages.status[value]}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{staffMessages.filters.code}</span>
          <Input
            name="code"
            defaultValue={code}
            maxLength={CODE_MAX_LENGTH}
            autoComplete="off"
            spellCheck={false}
            className="uppercase"
          />
        </label>
        <div className="grid content-start gap-1.5">
          <label htmlFor="coupons-vendor" className="type-label text-ink">
            {staffMessages.filters.vendorId}
          </label>
          <Input
            id="coupons-vendor"
            name="vendorId"
            defaultValue={vendorId}
            maxLength={36}
            autoComplete="off"
            aria-invalid={isVendorWrong || undefined}
            aria-describedby={isVendorWrong ? 'coupons-vendor-error' : undefined}
          />
          {isVendorWrong ? (
            <span id="coupons-vendor-error" className="type-small text-error">
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
        <CouponResults
          staffCoupons={staffCoupons}
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

function CouponResults({
  staffCoupons,
  columns,
  page,
  isFiltered,
  hrefFor,
}: {
  staffCoupons: ReturnType<typeof useStaffCoupons>;
  columns: Column<Coupon>[];
  page: number;
  isFiltered: boolean;
  hrefFor: (page: number) => string;
}) {
  const messages = useMessages();
  const staffMessages = messages.coupon.staff;
  if (staffCoupons.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (staffCoupons.isError) {
    return (
      <PartError
        error={staffCoupons.error}
        onRetry={() => void staffCoupons.refetch()}
        messages={messages}
      />
    );
  }
  if (staffCoupons.data.items.length === 0) {
    return (
      <StateBlock
        icon={Ticket}
        title={isFiltered ? staffMessages.emptyFiltered : staffMessages.empty}
        text={staffMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={staffCoupons.data.items}
        columns={columns}
        rowKey={(coupon) => coupon.id}
        caption={staffMessages.title}
      />
      <Pagination
        page={page}
        limit={staffCoupons.data.limit}
        total={staffCoupons.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
