'use client';

import { Tag } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { lazy, Suspense, type FormEvent } from 'react';
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
import { adminSalesPath, adminVendorPath, staffStockHistoryPath } from '@/lib/routes';
import { formatDate, formatRupees, formatTime } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { useStaffSaleCancel } from '@/features/sales/hooks/use-staff-sale-cancel';
import { useStaffSales } from '@/features/sales/hooks/use-sales';
import {
  canCancelSale,
  isIdShape,
  isSaleStatus,
  SALE_STATUSES,
  type StaffSale,
} from '@/features/sales/types';
import { SaleStatusChip } from './sale-status-chip';

/**
 * Every vendor's sales, for staff (Document 5, section 8.3; Document 8, Slice 5 notes). Filters by
 * status, vendor and variant, kept in the address (only those set); an id with the wrong shape is
 * marked and nothing is asked. Admins and moderators cancel an upcoming or active sale with a
 * reason; the other roles read it, with "View only". Each row links to its variant's stock history
 * for the roles that may read it, and, for an admin, to the vendor. The backend gives the sales by
 * their ids only, so the variant and the vendor are shown by id.
 */
const PAGE_SIZE = 20;

/** Loaded only for the roles that may cancel (Document 6, section 14). */
const StaffCancelSale = lazy(() =>
  import('./staff-cancel-sale').then((module) => ({ default: module.StaffCancelSale })),
);
const ID_FILTERS = [
  { name: 'vendorId', id: 'sales-vendor' },
  { name: 'variantId', id: 'sales-variant' },
] as const;

export interface StaffSaleAccess {
  canCancel: boolean;
  canReadStockHistory: boolean;
  canOpenVendor: boolean;
}

export function StaffSaleList({ lang, access }: { lang: Locale; access: StaffSaleAccess }) {
  const messages = useMessages();
  const salesMessages = messages.sales;
  const staffMessages = salesMessages.staff;
  const router = useRouter();
  const searchParams = useSearchParams();
  const askedStatus = searchParams.get('status');
  const status = isSaleStatus(askedStatus) ? askedStatus : '';
  const vendorId = (searchParams.get('vendorId') ?? '').trim();
  const variantId = (searchParams.get('variantId') ?? '').trim();
  const wrong = ID_FILTERS.filter(({ name }) => {
    const value = name === 'vendorId' ? vendorId : variantId;
    return value !== '' && !isIdShape(value);
  }).map(({ name }) => name);
  const page = pageNumber(searchParams.get('page'));
  const filters = { status, vendorId, variantId };
  const staffSales = useStaffSales(
    {
      status: status || undefined,
      vendorId: vendorId || undefined,
      variantId: variantId || undefined,
      page,
      limit: PAGE_SIZE,
    },
    wrong.length === 0,
  );
  const saleCancel = useStaffSaleCancel();
  const listPath = adminSalesPath(lang);
  const hasFilters = Boolean(status || vendorId || variantId);
  const when = (iso: string) => `${formatDate(iso, lang)}, ${formatTime(iso, lang)}`;

  /** With scripts, only the filters that are set go into the address; without, the form still works. */
  function showResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = new FormData(event.currentTarget);
    const valueOf = (name: string) => String(chosen.get(name) ?? '').trim();
    router.push(
      withQuery(listPath, {
        status: valueOf('status'),
        vendorId: valueOf('vendorId'),
        variantId: valueOf('variantId'),
      }),
    );
  }

  const columns: Column<StaffSale>[] = [
    {
      key: 'variant',
      header: salesMessages.columns.variant,
      lead: true,
      cell: (sale) => (
        <span className="grid gap-0.5">
          <span className="type-small break-all text-ink">{sale.variantId}</span>
          {access.canReadStockHistory ? (
            <a
              href={staffStockHistoryPath(lang, sale.variantId)}
              className="type-small text-ink-2 underline underline-offset-4"
            >
              {staffMessages.stockHistory}
            </a>
          ) : null}
        </span>
      ),
    },
    {
      key: 'status',
      header: salesMessages.columns.status,
      lead: true,
      cell: (sale) => <SaleStatusChip status={sale.status} messages={messages} />,
    },
    {
      key: 'vendor',
      header: staffMessages.vendor,
      cell: (sale) =>
        access.canOpenVendor ? (
          <a
            href={adminVendorPath(lang, sale.vendorId)}
            className="type-small break-all underline underline-offset-4"
          >
            {sale.vendorId}
          </a>
        ) : (
          <span className="type-small break-all">{sale.vendorId}</span>
        ),
    },
    {
      key: 'price',
      header: salesMessages.columns.salePrice,
      numeric: true,
      cell: (sale) => formatRupees(sale.salePricePaise),
    },
    {
      key: 'starts',
      header: salesMessages.columns.starts,
      cell: (sale) => <span className="whitespace-nowrap">{when(sale.startsAt)}</span>,
    },
    {
      key: 'ends',
      header: salesMessages.columns.ends,
      cell: (sale) => <span className="whitespace-nowrap">{when(sale.endsAt)}</span>,
    },
    {
      key: 'reason',
      header: staffMessages.cancelReason,
      cell: (sale) => sale.cancelReason ?? <span className="text-muted-foreground">—</span>,
    },
  ];
  if (access.canCancel) {
    columns.push({
      key: 'actions',
      header: salesMessages.columns.actions,
      cell: (sale) =>
        canCancelSale(sale.status) ? (
          <Suspense fallback={null}>
            <StaffCancelSale
              name={sale.variantId}
              isBusy={saleCancel.busyId === sale.id}
              onCancel={(reason, outcome) => saleCancel.cancel(sale.id, reason, outcome)}
            />
          </Suspense>
        ) : null,
    });
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{salesMessages.title}</h1>
        {access.canCancel ? null : <ViewOnlyChip label={staffMessages.viewOnly} />}
      </div>
      <p className="max-w-[72ch] text-ink-2">{staffMessages.intro}</p>
      <form
        method="get"
        action={listPath}
        onSubmit={showResults}
        noValidate
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start"
      >
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{salesMessages.filters.status}</span>
          <Select name="status" defaultValue={status}>
            <option value="">{salesMessages.filters.all}</option>
            {SALE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {salesMessages.status[value]}
              </option>
            ))}
          </Select>
        </label>
        {ID_FILTERS.map(({ name, id }) => (
          <div key={name} className="grid content-start gap-1.5">
            <label htmlFor={id} className="type-label text-ink">
              {staffMessages.filters[name]}
            </label>
            <Input
              id={id}
              name={name}
              defaultValue={filters[name]}
              maxLength={36}
              autoComplete="off"
              aria-invalid={wrong.includes(name) || undefined}
              aria-describedby={wrong.includes(name) ? `${id}-error` : undefined}
            />
            {wrong.includes(name) ? (
              <span id={`${id}-error`} className="type-small text-error">
                {staffMessages.filters.badId}
              </span>
            ) : null}
          </div>
        ))}
        <div className="flex gap-2 lg:mt-[26px]">
          <Button type="submit" variant="secondary">
            {salesMessages.filters.show}
          </Button>
          {hasFilters ? (
            <Button asChild variant="quiet">
              <a href={listPath}>{staffMessages.filters.clear}</a>
            </Button>
          ) : null}
        </div>
      </form>
      {wrong.length > 0 ? (
        <Banner tone="warning" title={staffMessages.fixFilters} />
      ) : (
        <StaffSaleResults
          staffSales={staffSales}
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

function StaffSaleResults({
  staffSales,
  columns,
  page,
  isFiltered,
  hrefFor,
}: {
  staffSales: ReturnType<typeof useStaffSales>;
  columns: Column<StaffSale>[];
  page: number;
  isFiltered: boolean;
  hrefFor: (page: number) => string;
}) {
  const messages = useMessages();
  const salesMessages = messages.sales;
  if (staffSales.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (staffSales.isError) {
    return (
      <PartError
        error={staffSales.error}
        onRetry={() => void staffSales.refetch()}
        messages={messages}
      />
    );
  }
  if (staffSales.data.items.length === 0) {
    return (
      <StateBlock
        icon={Tag}
        title={isFiltered ? salesMessages.emptyFiltered : salesMessages.staff.empty}
        text={salesMessages.staff.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={staffSales.data.items}
        columns={columns}
        rowKey={(sale) => sale.id}
        caption={salesMessages.title}
      />
      <Pagination
        page={page}
        limit={staffSales.data.limit}
        total={staffSales.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
