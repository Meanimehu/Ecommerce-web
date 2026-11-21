'use client';

import { Eye } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { useCategoryTree } from '@/features/storefront/product-list/hooks/use-product-list';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { moderationProductPath, moderationQueuePath } from '@/lib/routes';
import { findInTree } from '@/features/storefront/product-list/rules';
import { useReviewQueue } from '@/features/product/hooks/use-product';
import { ReviewKind, type ModerationRow } from '@/features/product/types';
import { formatDate } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { ProductStatusChip } from './product-status-chip';

/**
 * Product moderation queue (Document 5, section 8.3; approved Stage 5): two queues, new listings
 * and revisions of approved products (`?queue=revision`), each oldest first with numbered pages.
 * A revision's row names the live product and, when it changes the title, the proposed one. The
 * backend leaves out products of a vendor the reviewer owns.
 */
const PAGE_SIZE = 20;

const QUEUES: readonly ReviewKind[] = [ReviewKind.Listing, ReviewKind.Revision];

export function ModerationQueue({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const moderationMessages = messages.moderation;
  const searchParams = useSearchParams();
  const page = pageNumber(searchParams.get('page'));
  const queue =
    searchParams.get('queue') === ReviewKind.Revision ? ReviewKind.Revision : ReviewKind.Listing;
  const reviewQueue = useReviewQueue({ queue, page, limit: PAGE_SIZE });
  const categoryTree = useCategoryTree();
  const queuePath = moderationQueuePath(lang);
  const queueHref = (kind: ReviewKind, pageToShow = 1) =>
    withQuery(queuePath, {
      queue: kind === ReviewKind.Revision ? kind : undefined,
      page: pageToShow === 1 ? undefined : pageToShow,
    });
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
        <span className="grid gap-0.5">
          <Link
            href={moderationProductPath(lang, row.id)}
            className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
          >
            {row.title}
          </Link>
          {row.proposedTitle && row.proposedTitle !== row.title ? (
            <span className="type-small text-ink-2">
              {moderationMessages.proposedTitle}: {row.proposedTitle}
            </span>
          ) : null}
        </span>
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
      cell: (row) => {
        const sentAt = submittedOf(row, queue);
        return <span className="whitespace-nowrap">{sentAt ? formatDate(sentAt, lang) : '—'}</span>;
      },
    },
  ];

  return (
    <div className="grid gap-5">
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{moderationMessages.title}</h1>
      <nav aria-label={moderationMessages.queues} className="flex flex-wrap gap-2">
        {QUEUES.map((kind) => (
          <Link
            key={kind}
            href={queueHref(kind)}
            aria-current={kind === queue ? 'page' : undefined}
            className="inline-flex min-h-11 items-center rounded-2 border border-line px-4 type-label text-ink hover:border-ink aria-[current=page]:border-ink aria-[current=page]:bg-sunken"
          >
            {moderationMessages.queueNames[kind]}
          </Link>
        ))}
      </nav>
      <ReviewQueueResults
        reviewQueue={reviewQueue}
        columns={columns}
        page={page}
        hrefFor={(pageToShow) => queueHref(queue, pageToShow)}
        emptyText={
          queue === ReviewKind.Revision
            ? moderationMessages.emptyRevisions
            : moderationMessages.emptyText
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
  emptyText,
  messages,
}: {
  reviewQueue: ReturnType<typeof useReviewQueue>;
  columns: Column<ModerationRow>[];
  page: number;
  hrefFor: (page: number) => string;
  emptyText: string;
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
    return <StateBlock icon={Eye} title={moderationMessages.empty} text={emptyText} titleAs="h2" />;
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

/** When the row was sent: the listing's submission, or the revision's. */
function submittedOf(row: ModerationRow, queue: ReviewKind): string | null {
  return queue === ReviewKind.Revision ? (row.revisionSubmittedAt ?? null) : row.submittedAt;
}
