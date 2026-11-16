'use client';

import { Layers } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { bulkStockPath, myStockPath, stockHistoryPath, variantStockPath } from '@/lib/routes';
import { pageNumber, withQuery } from '@/utils/url';
import { useDictionaries } from '@/features/product/hooks/use-product';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { VendorStatus } from '@/features/vendor/types';
import { useMyStock, useStockSummary } from '@/features/stock/hooks/use-stock';
import { isStockState, STOCK_STATES, variantName, type StockRow } from '@/features/stock/types';
import { StockStateChip } from './stock-state-chip';

/**
 * The vendor's stock (Document 5, section 7.4; approved Stage 5): a summary strip with the number
 * of variants in stock, low and out; a filter by state kept in the address; and a table with
 * numbered pages: SKU, variant, available, state and threshold, with Change (approved vendors
 * only) and History. Switched-off variants are listed and marked. Bulk update is for approved
 * vendors; others read only, and the Vendor area's banner says why (section 7.5).
 */
const PAGE_SIZE = 20;

export function StockScreen({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const stockMessages = messages.stock;
  const searchParams = useSearchParams();
  const askedState = searchParams.get('status');
  const state = isStockState(askedState) ? askedState : '';
  const page = pageNumber(searchParams.get('page'));
  const myStock = useMyStock({ status: state || undefined, page, limit: PAGE_SIZE });
  const dictionaries = useDictionaries();
  const isApproved = useMyVendor().data?.status === VendorStatus.Approved;
  const listPath = myStockPath(lang);
  const nameOf = (row: StockRow) =>
    variantName(row, dictionaries.data?.sizes, dictionaries.data?.colours);

  const columns: Column<StockRow>[] = [
    {
      key: 'sku',
      header: stockMessages.columns.sku,
      cell: (row) => <span className="break-all">{row.sku}</span>,
    },
    {
      key: 'variant',
      header: stockMessages.columns.variant,
      lead: true,
      cell: (row) => (
        <span className="grid gap-0.5">
          <span className="font-medium text-ink">{nameOf(row)}</span>
          {row.variantStatus === 'inactive' ? (
            <span className="type-small text-ink-2">{stockMessages.switchedOff}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'available',
      header: stockMessages.columns.available,
      numeric: true,
      cell: (row) => row.available,
    },
    {
      key: 'state',
      header: stockMessages.columns.state,
      lead: true,
      cell: (row) => <StockStateChip state={row.state} messages={messages} />,
    },
    {
      key: 'threshold',
      header: stockMessages.columns.threshold,
      numeric: true,
      cell: (row) => row.effectiveThreshold,
    },
    {
      key: 'actions',
      header: stockMessages.columns.actions,
      cell: (row) => (
        <span className="flex flex-wrap gap-2">
          {isApproved ? (
            <Button asChild variant="secondary" size="small">
              <Link
                href={variantStockPath(lang, row.productId, row.variantId)}
                className="no-underline"
              >
                {stockMessages.change}
                <span className="sr-only">: {nameOf(row)}</span>
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="quiet" size="small">
            <Link
              href={stockHistoryPath(lang, row.productId, row.variantId)}
              className="no-underline"
            >
              {stockMessages.history}
              <span className="sr-only">: {nameOf(row)}</span>
            </Link>
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{stockMessages.title}</h1>
        {isApproved ? (
          <Button asChild variant="secondary">
            <Link href={bulkStockPath(lang)} className="no-underline">
              {stockMessages.bulkUpdate}
            </Link>
          </Button>
        ) : null}
      </div>
      <StockSummaryStrip />
      <form method="get" action={listPath} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{stockMessages.filters.state}</span>
          <Select name="status" defaultValue={state} className="lg:h-10">
            <option value="">{stockMessages.filters.all}</option>
            {STOCK_STATES.map((value) => (
              <option key={value} value={value}>
                {stockMessages.states[value]}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" variant="secondary">
          {stockMessages.filters.show}
        </Button>
      </form>
      <StockResults
        isFiltered={Boolean(state)}
        myStock={myStock}
        columns={columns}
        page={page}
        hrefFor={(pageToShow) =>
          withQuery(listPath, {
            status: state || undefined,
            page: pageToShow === 1 ? undefined : pageToShow,
          })
        }
        messages={messages}
      />
    </div>
  );
}

/** The summary strip, a part of its own: if it fails, it says so here and the list still shows. */
function StockSummaryStrip() {
  const messages = useMessages();
  const summaryMessages = messages.stock.summary;
  const summary = useStockSummary();

  if (summary.isPending) return <Skeleton className="h-16 w-full" />;
  if (summary.isError) {
    return (
      <PartError
        error={summary.error}
        onRetry={() => void summary.refetch()}
        messages={messages}
        title={summaryMessages.failed}
      />
    );
  }
  const counts = [
    { label: summaryMessages.inStock, count: summary.data.inStock },
    { label: summaryMessages.low, count: summary.data.low },
    { label: summaryMessages.out, count: summary.data.out },
  ];
  return (
    <section aria-label={summaryMessages.label}>
      <dl className="grid grid-cols-3 gap-3">
        {counts.map((item) => (
          <div
            key={item.label}
            className="grid gap-0.5 rounded-1 border border-line bg-surface px-4 py-3"
          >
            <dt className="type-small text-ink-2">{item.label}</dt>
            <dd className="type-h3 text-ink tabular-nums">{item.count}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The list itself: loading, failed, empty, or the table with its pages. */
function StockResults({
  isFiltered,
  myStock,
  columns,
  page,
  hrefFor,
  messages,
}: {
  isFiltered: boolean;
  myStock: ReturnType<typeof useMyStock>;
  columns: Column<StockRow>[];
  page: number;
  hrefFor: (page: number) => string;
  messages: Messages;
}) {
  const stockMessages = messages.stock;
  if (myStock.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (myStock.isError) {
    return (
      <PartError error={myStock.error} onRetry={() => void myStock.refetch()} messages={messages} />
    );
  }
  if (myStock.data.items.length === 0) {
    return (
      <StateBlock
        icon={Layers}
        title={isFiltered ? stockMessages.emptyFiltered : stockMessages.empty}
        text={isFiltered ? stockMessages.emptyFilteredText : stockMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={myStock.data.items}
        columns={columns}
        rowKey={(row) => row.variantId}
        caption={stockMessages.title}
      />
      <Pagination
        page={page}
        limit={PAGE_SIZE}
        total={myStock.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
