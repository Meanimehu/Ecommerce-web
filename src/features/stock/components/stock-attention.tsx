'use client';

import { CountTile } from '@/components/common/count-tile';
import { PartError } from '@/components/common/load-states';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myStockPath } from '@/lib/routes';
import { withQuery } from '@/utils/url';
import { useStockSummary } from '@/features/stock/hooks/use-stock';
import { StockState } from '@/features/stock/types';

/**
 * The vendor home's stock counts (Document 5, section 7.2): variants low on stock and out of stock,
 * from the backend's summary, each a link to the stock list filtered to it. A part of its own: if
 * the summary fails, it says so in place and the rest of the home stays.
 */
export function StockAttention({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const attention = messages.stock.attention;
  const summary = useStockSummary();
  if (summary.isPending) {
    return (
      <>
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </>
    );
  }
  if (summary.isError) {
    return (
      <PartError
        error={summary.error}
        onRetry={() => void summary.refetch()}
        messages={messages}
        title={messages.stock.summary.failed}
      />
    );
  }
  const stockPath = myStockPath(lang);
  return (
    <>
      <CountTile
        count={summary.data.low}
        label={attention.low}
        href={withQuery(stockPath, { status: StockState.Low })}
      />
      <CountTile
        count={summary.data.out}
        label={attention.out}
        href={withQuery(stockPath, { status: StockState.Out })}
      />
    </>
  );
}
