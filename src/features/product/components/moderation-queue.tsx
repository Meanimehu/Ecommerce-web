'use client';

import { Eye } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { useCategoryTree } from '@/hooks/use-category-tree';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { moderationProductPath, moderationQueuePath } from '@/lib/routes';
import { findInTree } from '@/types/catalogue';
import { useReviewQueue } from '@/features/product/hooks/use-product';
import { ReviewKind, type ModerationRow } from '@/features/product/types';
import { formatDate } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { ProductStatusChip } from './product-status-chip';

/**
 * Product moderation queue (Document 5, section 8.3; approved Stage 5): submitted products, oldest
 * first, with numbered pages. The backend leaves out products of a vendor the reviewer owns.
 * Revisions of approved products come with the vendor's revision screens in Slice 4.
 */
const PAGE_SIZE = 20;

export function ModerationQueue({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const moderationMessages = messages.moderation;
  const searchParams = useSearchParams();
  const page = pageNumber(searchParams.get('page'));
  const reviewQueue = useReviewQueue({ queue: ReviewKind.Listing, page, limit: PAGE_SIZE });
  const categoryTree = useCategoryTree();
  const queuePath = moderationQueuePath(lang);
  const categoryPath = (categoryId: string) =>
    findInTree(categoryTree.data?.items ?? [], (node) => node.id === categoryId)
      ?.map((node) => node.name)
      .join(' › ') ?? '—';

  const columns: Column<ModerationRow>[] = [
    {
      key: 'title',
      header: moderationMessages.columns.product,
      lead: true,
      cell: (row) => (
        <Link
          href={moderationProductPath(lang, row.id)}
          className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'status',
      header: moderationMessages.columns.status,
      lead: true,
      cell: (row) => <ProductStatusChip status={row.status} messages={messages} />,
    },
    {
      key: 'category',
      header: moderationMessages.columns.category,
      cell: (row) => categoryPath(row.categoryId),
    },
    {
      key: 'submitted',
      header: moderationMessages.columns.submitted,
      cell: (row) => (
        <span className="whitespace-nowrap">
          {row.submittedAt ? formatDate(row.submittedAt, lang) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="grid gap-5">
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{moderationMessages.title}</h1>
      <ReviewQueueResults
        reviewQueue={reviewQueue}
        columns={columns}
        page={page}
        hrefFor={(pageToShow) =>
          withQuery(queuePath, { page: pageToShow === 1 ? undefined : pageToShow })
        }
        messages={messages}
      />
      <p className="type-small text-muted-foreground">{moderationMessages.ownVendorNote}</p>
    </div>
  );
}

/** The queue itself: loading, failed, empty, or the table with its pages. */
function ReviewQueueResults({
  reviewQueue,
  columns,
  page,
  hrefFor,
  messages,
}: {
  reviewQueue: ReturnType<typeof useReviewQueue>;
  columns: Column<ModerationRow>[];
  page: number;
  hrefFor: (page: number) => string;
  messages: Messages;
}) {
  const moderationMessages = messages.moderation;
  if (reviewQueue.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (reviewQueue.isError) {
    return (
      <PartError
        error={reviewQueue.error}
        onRetry={() => void reviewQueue.refetch()}
        messages={messages}
      />
    );
  }
  if (reviewQueue.data.items.length === 0) {
    return (
      <StateBlock
        icon={Eye}
        title={moderationMessages.empty}
        text={moderationMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={reviewQueue.data.items}
        columns={columns}
        rowKey={(row) => row.id}
        caption={moderationMessages.title}
      />
      <Pagination
        page={page}
        limit={PAGE_SIZE}
        total={reviewQueue.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
