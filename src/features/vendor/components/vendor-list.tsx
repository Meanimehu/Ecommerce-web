'use client';

import { Store } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { VendorStatusChip } from '@/features/vendor/components/vendor-status-chip';
import { useVendorList } from '@/features/vendor/hooks/use-vendor';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { formatDate, formatPhone } from '@/utils/format';
import { VENDOR_STATUSES, type AdminVendorRow } from '@/features/vendor/types';
import { pageNumber, withQuery } from '@/utils/url';

/**
 * Vendor review list (Document 5, section 8.3; approved Stage 5): filters by status and waiting documents and a search,
 * all kept in the address so a link can be shared and the back button works; numbered pages; the vendor's name opens
 * the application. With "Submitted" the backend lists the oldest submission first (the review queue).
 */
const LIMIT = 20;

export function VendorList({ lang }: { lang: Locale }) {
  const t = useMessages();
  const params = useSearchParams();
  const status = params.get('status') ?? '';
  const documents = params.get('documents') ?? '';
  const q = params.get('q') ?? '';
  const page = pageNumber(params.get('page'));
  const query = { status, hasPendingDocuments: documents, q, page, limit: LIMIT };
  const list = useVendorList(query);
  const base = `/${lang}/admin/vendors`;
  const hrefFor = (n: number) => withQuery(base, { status, documents, q, page: n === 1 ? undefined : n });

  const columns: Column<AdminVendorRow>[] = [
    {
      key: 'name',
      header: t.adminVendors.columns.vendor,
      lead: true,
      cell: (row) => (
        <a href={`${base}/${row.id}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
          {row.displayName}
        </a>
      ),
    },
    { key: 'status', header: t.adminVendors.columns.status, lead: true, cell: (row) => <VendorStatusChip status={row.status} t={t} /> },
    { key: 'legal', header: t.adminVendors.columns.legalName, cell: (row) => row.legalName },
    { key: 'phone', header: t.adminVendors.columns.phone, cell: (row) => (row.ownerPhone ? <span className="whitespace-nowrap tabular-nums">{formatPhone(row.ownerPhone)}</span> : '—') },
    { key: 'documents', header: t.adminVendors.columns.documents, numeric: true, cell: (row) => row.pendingDocuments },
    { key: 'submitted', header: t.adminVendors.columns.submitted, cell: (row) => <span className="whitespace-nowrap">{row.submittedAt ? formatDate(row.submittedAt, lang) : '—'}</span> },
  ];

  return (
    <div className="grid gap-5">
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{t.adminVendors.title}</h1>
      <form method="get" action={base} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[200px_200px_minmax(0,1fr)_auto] lg:items-start">
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{t.adminVendors.filters.status}</span>
          <Select name="status" defaultValue={status}>
            <option value="">{t.adminVendors.filters.allStatuses}</option>
            {VENDOR_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t.vendor.status[value]}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{t.adminVendors.filters.documents}</span>
          <Select name="documents" defaultValue={documents}>
            <option value="">{t.adminVendors.filters.any}</option>
            <option value="true">{t.adminVendors.filters.yes}</option>
            <option value="false">{t.adminVendors.filters.no}</option>
          </Select>
        </label>
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{t.adminVendors.filters.search}</span>
          <Input type="search" name="q" defaultValue={q} maxLength={100} aria-describedby="vendor-search-help" />
          <span id="vendor-search-help" className="type-small text-muted-foreground">
            {t.adminVendors.filters.searchHelp}
          </span>
        </label>
        <div className="flex gap-2 lg:mt-[26px]">
          <Button type="submit" variant="secondary">
            {t.adminVendors.filters.show}
          </Button>
          {status || documents || q ? (
            <Button asChild variant="quiet">
              <a href={base}>{t.adminVendors.filters.clear}</a>
            </Button>
          ) : null}
        </div>
      </form>
      {list.isPending ? (
        <LoadingBlock messages={t} lines={6} />
      ) : list.isError ? (
        <PartError error={list.error} onRetry={() => void list.refetch()} messages={t} />
      ) : list.data.items.length === 0 ? (
        <StateBlock icon={Store} title={t.adminVendors.empty} text={t.adminVendors.emptyText} titleAs="h2" />
      ) : (
        <>
          <DataTable rows={list.data.items} columns={columns} rowKey={(row) => row.id} caption={t.adminVendors.title} />
          <Pagination page={page} limit={list.data.limit} total={list.data.total} hrefFor={hrefFor} messages={t} />
        </>
      )}
    </div>
  );
}
