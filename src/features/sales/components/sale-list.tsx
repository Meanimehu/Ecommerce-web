'use client';

import { Tag } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DataTable, type Column } from '@/components/common/data-table';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
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
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { fill, messageFor } from '@/lib/errors';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { mySalesPath, newSalePath } from '@/lib/routes';
import { formatDate, formatRupees, formatTime } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { useDictionaries } from '@/features/product/hooks/use-product';
import { useEveryStockRow } from '@/features/stock/hooks/use-stock';
import { variantName } from '@/features/stock/types';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { VendorStatus } from '@/features/vendor/types';
import { useSaleCancel } from '@/features/sales/hooks/use-sale-cancel';
import { useMySales } from '@/features/sales/hooks/use-sales';
import { canCancelSale, isSaleStatus, SALE_STATUSES } from '@/features/sales/rules';
import type { Sale } from '@/features/sales/types';
import { SaleStatusChip } from './sale-status-chip';

/**
 * The vendor's sale prices (Document 5, section 8.2; approved Stage 5): newest first with numbered
 * pages and a status filter in the address; each row the variant, the sale price, when it starts
 * and ends (IST) and its status; "Cancel sale" (with a confirmation) on an upcoming or active one
 * for an approved vendor. A sale is never edited. The sale itself names only its variant, so the
 * variant's name comes from the vendor's stock list, where every variant is.
 */
const PAGE_SIZE = 20;

export function SaleList({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const salesMessages = messages.sales;
  const searchParams = useSearchParams();
  const askedStatus = searchParams.get('status');
  const status = isSaleStatus(askedStatus) ? askedStatus : '';
  const page = pageNumber(searchParams.get('page'));
  const mySales = useMySales({ status: status || undefined, page, limit: PAGE_SIZE });
  const everyVariant = useEveryStockRow(true);
  const dictionaries = useDictionaries();
  const isApproved = useMyVendor().data?.status === VendorStatus.Approved;
  const saleCancel = useSaleCancel();
  const listPath = mySalesPath(lang);

  const nameOf = (sale: Sale) => {
    const row = everyVariant.data?.find((variant) => variant.variantId === sale.variantId);
    return row
      ? `${variantName(row, dictionaries.data?.sizes, dictionaries.data?.colours)} (${row.sku})`
      : '…';
  };
  const when = (iso: string) => `${formatDate(iso, lang)}, ${formatTime(iso, lang)}`;

  const columns: Column<Sale>[] = [
    {
      key: 'variant',
      header: salesMessages.columns.variant,
      lead: true,
      cell: (sale) => <span className="font-medium text-ink">{nameOf(sale)}</span>,
    },
    {
      key: 'status',
      header: salesMessages.columns.status,
      lead: true,
      cell: (sale) => <SaleStatusChip status={sale.status} messages={messages} />,
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
      key: 'actions',
      header: salesMessages.columns.actions,
      cell: (sale) =>
        isApproved && canCancelSale(sale.status) ? (
          <CancelSale
            name={nameOf(sale)}
            isBusy={saleCancel.busyId === sale.id}
            onCancel={() => saleCancel.cancel(sale.id)}
          />
        ) : null,
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{salesMessages.title}</h1>
        {isApproved ? (
          <Button asChild>
            <Link href={newSalePath(lang)} className="no-underline">
              {salesMessages.newSale}
            </Link>
          </Button>
        ) : null}
      </div>
      <p className="max-w-[72ch] text-ink-2">{salesMessages.intro}</p>
      <form method="get" action={listPath} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{salesMessages.filters.status}</span>
          <Select name="status" defaultValue={status} className="lg:h-10">
            <option value="">{salesMessages.filters.all}</option>
            {SALE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {salesMessages.status[value]}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" variant="secondary">
          {salesMessages.filters.show}
        </Button>
      </form>
      {saleCancel.error ? (
        <ErrorMessage
          text={messageFor(saleCancel.error, messages)}
          requestId={saleCancel.error.requestId}
          messages={messages}
        />
      ) : null}
      <SaleResults
        isFiltered={Boolean(status)}
        mySales={mySales}
        columns={columns}
        page={page}
        hrefFor={(pageToShow) =>
          withQuery(listPath, {
            status: status || undefined,
            page: pageToShow === 1 ? undefined : pageToShow,
          })
        }
        messages={messages}
      />
    </div>
  );
}

/** "Cancel sale", which asks first. */
function CancelSale({
  name,
  isBusy,
  onCancel,
}: {
  name: string;
  isBusy: boolean;
  onCancel: () => void;
}) {
  const salesMessages = useMessages().sales;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="secondary" size="small" loading={isBusy}>
          {salesMessages.cancel}
          <span className="sr-only">: {name}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{salesMessages.cancelTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {fill(salesMessages.cancelBody, { variant: name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{salesMessages.keep}</AlertDialogCancel>
          <AlertDialogAction variant="destructiveConfirm" onClick={onCancel}>
            {salesMessages.cancel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** The list itself: loading, failed, empty, or the table with its pages. */
function SaleResults({
  isFiltered,
  mySales,
  columns,
  page,
  hrefFor,
  messages,
}: {
  isFiltered: boolean;
  mySales: ReturnType<typeof useMySales>;
  columns: Column<Sale>[];
  page: number;
  hrefFor: (page: number) => string;
  messages: Messages;
}) {
  const salesMessages = messages.sales;
  if (mySales.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (mySales.isError) {
    return (
      <PartError error={mySales.error} onRetry={() => void mySales.refetch()} messages={messages} />
    );
  }
  if (mySales.data.items.length === 0) {
    return (
      <StateBlock
        icon={Tag}
        title={isFiltered ? salesMessages.emptyFiltered : salesMessages.empty}
        text={isFiltered ? salesMessages.emptyFilteredText : salesMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={mySales.data.items}
        columns={columns}
        rowKey={(sale) => sale.id}
        caption={salesMessages.title}
      />
      <Pagination
        page={page}
        limit={PAGE_SIZE}
        total={mySales.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
