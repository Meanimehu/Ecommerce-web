'use client';

import { Package } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { useMyProducts } from '@/hooks/use-product';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { fill } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { PRODUCT_STATUSES, type ProductRow } from '@/types/product';
import { formatDate } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { ProductStatusChip } from './product-status';

/**
 * My products (Document 5, section 7.3): numbered pages, a status filter and a title search in the address; each row
 * shows the status, the number of variants, whether anything is still missing, and the last change. The product list
 * the backend sends has no photo or price (area-3b-products.md, GET /vendors/me/products), so none is shown here.
 * Only an approved vendor can add products; others see why (Document 5, section 7.5).
 */
const LIMIT = 20;

export function ProductList({ lang }: { lang: Locale }) {
  const t = useMessages();
  const p = t.product;
  const params = useSearchParams();
  const status = params.get('status') ?? '';
  const q = params.get('q') ?? '';
  const page = pageNumber(params.get('page'));
  const list = useMyProducts({ status, q, page, limit: LIMIT });
  const vendor = useMyVendor();
  const approved = vendor.data?.status === 'approved';
  const base = `/${lang}/vendor/products`;

  const columns: Column<ProductRow>[] = [
    {
      key: 'title',
      header: p.columns.title,
      lead: true,
      cell: (row) => (
        <Link href={`${base}/${row.id}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
          {row.title}
        </Link>
      ),
    },
    { key: 'status', header: p.columns.status, lead: true, cell: (row) => <ProductStatusChip status={row.status} t={t} /> },
    { key: 'variants', header: p.columns.variants, numeric: true, cell: (row) => row.variantCount },
    {
      key: 'missing',
      header: p.columns.ready,
      cell: (row) =>
        row.missing.length === 0 ? p.ready : row.missing.length === 1 ? p.missingOne : fill(p.missingMany, { count: row.missing.length }),
    },
    { key: 'changed', header: p.columns.changed, cell: (row) => <span className="whitespace-nowrap">{formatDate(row.updatedAt, lang)}</span> },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{p.title}</h1>
        {approved ? (
          <Button asChild>
            <Link href={`${base}/new`} className="no-underline">
              {p.add}
            </Link>
          </Button>
        ) : null}
      </div>
      {vendor.data && !approved ? <Banner tone={vendor.data.status === 'suspended' || vendor.data.status === 'rejected' ? 'error' : 'info'}>{p.notApproved}</Banner> : null}
      <form method="get" action={base} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{p.filters.status}</span>
          <Select name="status" defaultValue={status} className="lg:h-10">
            <option value="">{p.filters.all}</option>
            {PRODUCT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {p.status[value]}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{p.filters.search}</span>
          <Input type="search" name="q" defaultValue={q} maxLength={100} className="lg:h-10" />
        </label>
        <Button type="submit" variant="secondary">
          {p.filters.show}
        </Button>
      </form>
      {list.isPending ? (
        <LoadingBlock messages={t} lines={6} />
      ) : list.isError ? (
        <PartError error={list.error} onRetry={() => void list.refetch()} messages={t} />
      ) : list.data.items.length === 0 ? (
        <StateBlock icon={Package} title={status || q ? p.emptyFiltered : p.empty} text={status || q ? p.emptyFilteredText : p.emptyText} titleAs="h2" />
      ) : (
        <>
          <DataTable rows={list.data.items} columns={columns} rowKey={(row) => row.id} caption={p.title} />
          <Pagination page={page} limit={LIMIT} total={list.data.total} hrefFor={(n) => withQuery(base, { status, q, page: n === 1 ? undefined : n })} messages={t} />
        </>
      )}
    </div>
  );
}
