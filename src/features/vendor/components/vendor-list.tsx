'use client';

import { Store } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminVendorPath, adminVendorsPath } from '@/lib/routes';
import { formatDate, formatPhone } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { useVendorList } from '@/features/vendor/hooks/use-vendor';
import { VENDOR_STATUSES, type AdminVendorRow } from '@/features/vendor/types';
import { VendorStatusChip } from './vendor-status-chip';

/**
 * Vendor review list (Document 5, section 8.3; approved Stage 5): filters by status and waiting
 * documents and a search, all kept in the address so a link can be shared and the back button
 * works; numbered pages; the vendor's name opens the application. With "Submitted" the backend
 * lists the oldest submission first (the review queue).
 */
const PAGE_SIZE = 20;

export function VendorList({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const listMessages = messages.adminVendors;
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const pendingDocuments = searchParams.get('documents') ?? '';
  const searchText = searchParams.get('q') ?? '';
  const page = pageNumber(searchParams.get('page'));
  const vendorList = useVendorList({
    status,
    hasPendingDocuments: pendingDocuments,
    q: searchText,
    page,
    limit: PAGE_SIZE,
  });
  const listPage = adminVendorsPath(lang);
  const hasFilters = Boolean(status || pendingDocuments || searchText);
  const hrefFor = (pageToShow: number) =>
    withQuery(listPage, {
      status,
      documents: pendingDocuments,
      q: searchText,
      page: pageToShow === 1 ? undefined : pageToShow,
    });

  const columns: Column<AdminVendorRow>[] = [
    {
      key: 'name',
      header: listMessages.columns.vendor,
      lead: true,
      cell: (row) => (
        <a
          href={adminVendorPath(lang, row.id)}
          className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          {row.displayName}
        </a>
      ),
    },
    {
      key: 'status',
      header: listMessages.columns.status,
      lead: true,
      cell: (row) => <VendorStatusChip status={row.status} messages={messages} />,
    },
    { key: 'legal', header: listMessages.columns.legalName, cell: (row) => row.legalName },
    {
      key: 'phone',
      header: listMessages.columns.phone,
      cell: (row) =>
        row.ownerPhone ? (
          <span className="whitespace-nowrap tabular-nums">{formatPhone(row.ownerPhone)}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'documents',
      header: listMessages.columns.documents,
      numeric: true,
      cell: (row) => row.pendingDocuments,
    },
    {
      key: 'submitted',
      header: listMessages.columns.submitted,
      cell: (row) => (
        <span className="whitespace-nowrap">
          {row.submittedAt ? formatDate(row.submittedAt, lang) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="grid gap-5">
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{listMessages.title}</h1>
      <form
        method="get"
        action={listPage}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[200px_200px_minmax(0,1fr)_auto] lg:items-start"
      >
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{listMessages.filters.status}</span>
          <Select name="status" defaultValue={status}>
            <option value="">{listMessages.filters.allStatuses}</option>
            {VENDOR_STATUSES.map((vendorStatus) => (
              <option key={vendorStatus} value={vendorStatus}>
                {messages.vendor.status[vendorStatus]}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{listMessages.filters.documents}</span>
          <Select name="documents" defaultValue={pendingDocuments}>
            <option value="">{listMessages.filters.any}</option>
            <option value="true">{listMessages.filters.yes}</option>
            <option value="false">{listMessages.filters.no}</option>
          </Select>
        </label>
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{listMessages.filters.search}</span>
          <Input
            type="search"
            name="q"
            defaultValue={searchText}
            maxLength={100}
            aria-describedby="vendor-search-help"
          />
          <span id="vendor-search-help" className="type-small text-muted-foreground">
            {listMessages.filters.searchHelp}
          </span>
        </label>
        <div className="flex gap-2 lg:mt-[26px]">
          <Button type="submit" variant="secondary">
            {listMessages.filters.show}
          </Button>
          {hasFilters ? (
            <Button asChild variant="quiet">
              <a href={listPage}>{listMessages.filters.clear}</a>
            </Button>
          ) : null}
        </div>
      </form>
      <VendorListResults vendorList={vendorList} columns={columns} page={page} hrefFor={hrefFor} />
    </div>
  );
}

function VendorListResults({
  vendorList,
  columns,
  page,
  hrefFor,
}: {
  vendorList: ReturnType<typeof useVendorList>;
  columns: Column<AdminVendorRow>[];
  page: number;
  hrefFor: (pageToShow: number) => string;
}) {
  const messages = useMessages();
  const listMessages = messages.adminVendors;

  if (vendorList.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (vendorList.isError) {
    return (
      <PartError
        error={vendorList.error}
        onRetry={() => void vendorList.refetch()}
        messages={messages}
      />
    );
  }
  if (vendorList.data.items.length === 0) {
    return (
      <StateBlock
        icon={Store}
        title={listMessages.empty}
        text={listMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={vendorList.data.items}
        columns={columns}
        rowKey={(row) => row.id}
        caption={listMessages.title}
      />
      <Pagination
        page={page}
        limit={vendorList.data.limit}
        total={vendorList.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
