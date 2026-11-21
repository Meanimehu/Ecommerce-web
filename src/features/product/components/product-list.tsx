'use client';

import { Package } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { addProductPath, myImportsPath, myProductPath, myProductsPath } from '@/lib/routes';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { VendorStatus } from '@/features/vendor/types';
import { useMyProducts } from '@/features/product/hooks/use-product';
import { PRODUCT_STATUSES, type ProductRow } from '@/features/product/types';
import { formatDate } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { missingCountText } from './missing-count-text';
import { ProductStatusChip } from './product-status-chip';

/**
 * My products (Document 5, section 7.3): numbered pages, a status filter and a title search in the
 * address; each row shows the status, the number of variants, whether anything is still missing,
 * and the last change. The product list the backend sends has no photo or price
 * (area-3b-products.md, GET /vendors/me/products), so none is shown here. Only an approved vendor
 * can add products; the Vendor area's one banner says why to the others (Document 5, section 7.5).
 */
const PAGE_SIZE = 20;

export function ProductList({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const productMessages = messages.product;
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const searchText = searchParams.get('q') ?? '';
  const page = pageNumber(searchParams.get('page'));
  const query = { status, q: searchText, page, limit: PAGE_SIZE };
  const myProducts = useMyProducts(query);
  const myVendor = useMyVendor();
  const vendorStatus = myVendor.data?.status;
  const isApproved = vendorStatus === VendorStatus.Approved;
  const listPath = myProductsPath(lang);

  const columns: Column<ProductRow>[] = [
    {
      key: 'title',
      header: productMessages.columns.title,
      lead: true,
      cell: (row) => (
        <Link
          href={myProductPath(lang, row.id)}
          className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'status',
      header: productMessages.columns.status,
      lead: true,
      cell: (row) => <ProductStatusChip status={row.status} messages={messages} />,
    },
    {
      key: 'variants',
      header: productMessages.columns.variants,
      numeric: true,
      cell: (row) => row.variantCount,
    },
    {
      key: 'missing',
      header: productMessages.columns.ready,
      cell: (row) => missingCountText(row.missing.length, productMessages),
    },
    {
      key: 'changed',
      header: productMessages.columns.changed,
      cell: (row) => <span className="whitespace-nowrap">{formatDate(row.updatedAt, lang)}</span>,
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{productMessages.title}</h1>
        <div className="flex flex-wrap gap-3">
          {/* The template and the imports can be read in any vendor status; only uploading needs approval. */}
          <Button asChild variant="secondary">
            <Link href={myImportsPath(lang)} className="no-underline">
              {productMessages.importCsv}
            </Link>
          </Button>
          {isApproved ? (
            <Button asChild>
              <Link href={addProductPath(lang)} className="no-underline">
                {productMessages.add}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
      <form method="get" action={listPath} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{productMessages.filters.status}</span>
          <Select name="status" defaultValue={status} className="lg:h-10">
            <option value="">{productMessages.filters.all}</option>
            {PRODUCT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {productMessages.status[value]}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{productMessages.filters.search}</span>
          <Input
            type="search"
            name="q"
            defaultValue={searchText}
            maxLength={100}
            className="lg:h-10"
          />
        </label>
        <Button type="submit" variant="secondary">
          {productMessages.filters.show}
        </Button>
      </form>
      <ProductListResults
        isFiltered={Boolean(status || searchText)}
        myProducts={myProducts}
        columns={columns}
        hrefFor={(pageNumberToShow) =>
          withQuery(listPath, {
            status,
            q: searchText,
            page: pageNumberToShow === 1 ? undefined : pageNumberToShow,
          })
        }
        page={page}
        messages={messages}
      />
    </div>
  );
}

/** The list itself: loading, failed, empty, or the table with its pages. */
function ProductListResults({
  isFiltered,
  myProducts,
  columns,
  hrefFor,
  page,
  messages,
}: {
  isFiltered: boolean;
  myProducts: ReturnType<typeof useMyProducts>;
  columns: Column<ProductRow>[];
  hrefFor: (page: number) => string;
  page: number;
  messages: Messages;
}) {
  const productMessages = messages.product;
  if (myProducts.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (myProducts.isError) {
    return (
      <PartError
        error={myProducts.error}
        onRetry={() => void myProducts.refetch()}
        messages={messages}
      />
    );
  }
  if (myProducts.data.items.length === 0) {
    return (
      <StateBlock
        icon={Package}
        title={isFiltered ? productMessages.emptyFiltered : productMessages.empty}
        text={isFiltered ? productMessages.emptyFilteredText : productMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={myProducts.data.items}
        columns={columns}
        rowKey={(row) => row.id}
        caption={productMessages.title}
      />
      <Pagination
        page={page}
        limit={PAGE_SIZE}
        total={myProducts.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
