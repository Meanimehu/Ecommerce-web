'use client';

import { History } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { staffStockHistoryPath } from '@/lib/routes';
import { pageNumber, withQuery } from '@/utils/url';
import { useStaffStockHistory } from '@/features/stock/hooks/use-stock';
import { historyColumns } from './history-columns';

/**
 * Any variant's stock history, for admins, moderators and support (Document 5, section 8.3;
 * Document 8, Slice 5 notes), read only. Reached from a link on the staff sales list or the
 * moderation review: the backend has no staff search for variants (an open item), so the variant
 * is shown by its id, as the link gave it. Newest first, with numbered pages.
 */
const PAGE_SIZE = 20;

export function StaffStockHistory({ lang, variantId }: { lang: Locale; variantId: string }) {
  const messages = useMessages();
  const stockMessages = messages.stock;
  const searchParams = useSearchParams();
  const page = pageNumber(searchParams.get('page'));
  const history = useStaffStockHistory(variantId, { page, limit: PAGE_SIZE });

  return (
    <div className="grid gap-5">
      <div className="grid gap-2 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{stockMessages.staffHistoryTitle}</h1>
        <p className="type-small break-all text-ink-2">
          {fill(stockMessages.staffHistoryVariant, { id: variantId })}
        </p>
      </div>
      {history.isPending ? <LoadingBlock messages={messages} lines={6} /> : null}
      {history.isError ? (
        <PartError
          error={history.error}
          onRetry={() => void history.refetch()}
          messages={messages}
        />
      ) : null}
      {history.isSuccess && history.data.items.length === 0 ? (
        <StateBlock
          icon={History}
          title={stockMessages.historyEmpty}
          text={stockMessages.historyEmptyText}
          titleAs="h2"
        />
      ) : null}
      {history.isSuccess && history.data.items.length > 0 ? (
        <>
          <DataTable
            rows={history.data.items}
            columns={historyColumns(lang, messages)}
            rowKey={(entry) => entry.id}
            caption={stockMessages.staffHistoryTitle}
          />
          <Pagination
            page={page}
            limit={PAGE_SIZE}
            total={history.data.total}
            hrefFor={(pageToShow) =>
              withQuery(staffStockHistoryPath(lang, variantId), {
                page: pageToShow === 1 ? undefined : pageToShow,
              })
            }
            messages={messages}
          />
        </>
      ) : null}
    </div>
  );
}
