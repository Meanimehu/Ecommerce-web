'use client';

import { Eye } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { ProductStatusChip } from '@/components/product/product-status';
import { useCategoryTree, useQueue } from '@/hooks/use-moderation';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { findInTree } from '@/types/catalogue';
import type { ModerationRow } from '@/types/product';
import { formatDate } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';

/**
 * Product moderation queue (Document 5, section 8.3; approved Stage 5): submitted products, oldest first, with numbered
 * pages. The backend leaves out products of a vendor the reviewer owns. Revisions of approved products come with the
 * vendor's revision screens in Slice 4.
 */
const LIMIT = 20;

export function ModerationQueue({ lang }: { lang: Locale }) {
  const t = useMessages();
  const m = t.moderation;
  const params = useSearchParams();
  const page = pageNumber(params.get('page'));
  const queue = useQueue({ queue: 'listing', page, limit: LIMIT });
  const tree = useCategoryTree();
  const base = `/${lang}/admin/moderation`;
  const categoryName = (id: string) => findInTree(tree.data?.items ?? [], (node) => node.id === id)?.map((node) => node.name).join(' › ') ?? '—';

  const columns: Column<ModerationRow>[] = [
    {
      key: 'title',
      header: m.columns.product,
      lead: true,
      cell: (row) => (
        <Link href={`${base}/${row.id}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
          {row.title}
        </Link>
      ),
    },
    { key: 'status', header: m.columns.status, lead: true, cell: (row) => <ProductStatusChip status={row.status} t={t} /> },
    { key: 'category', header: m.columns.category, cell: (row) => categoryName(row.categoryId) },
    { key: 'submitted', header: m.columns.submitted, cell: (row) => <span className="whitespace-nowrap">{row.submittedAt ? formatDate(row.submittedAt, lang) : '—'}</span> },
  ];

  return (
    <div className="grid gap-5">
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{m.title}</h1>
      {queue.isPending ? (
        <LoadingBlock t={t} lines={6} />
      ) : queue.isError ? (
        <PartError error={queue.error} onRetry={() => void queue.refetch()} t={t} />
      ) : queue.data.items.length === 0 ? (
        <StateBlock icon={Eye} title={m.empty} text={m.emptyText} titleAs="h2" />
      ) : (
        <>
          <DataTable rows={queue.data.items} columns={columns} rowKey={(row) => row.id} caption={m.title} />
          <Pagination page={page} limit={LIMIT} total={queue.data.total} hrefFor={(n) => withQuery(base, { page: n === 1 ? undefined : n })} t={t} />
        </>
      )}
      <p className="type-small text-muted-foreground">{m.ownVendorNote}</p>
    </div>
  );
}
