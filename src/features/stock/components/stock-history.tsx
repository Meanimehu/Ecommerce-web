'use client';

import { History } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { DataTable } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myStockPath, stockHistoryPath, variantStockPath } from '@/lib/routes';
import { pageNumber, withQuery } from '@/utils/url';
import { useDictionaries } from '@/features/product/hooks/use-product';
import { useMyStock, useStockHistory } from '@/features/stock/hooks/use-stock';
import { variantName } from '@/features/stock/types';
import { historyColumns } from './history-columns';
import { VariantNotFound } from './stock-change';

/**
 * One variant's stock history (Document 5, section 7.4; approved Stage 5): newest first, with
 * numbered pages, the date and time in IST, what changed, the number after it and the note. Open
 * to a vendor in any status.
 */
const PAGE_SIZE = 20;
const PRODUCT_VARIANTS = 100;

export function StockHistory({
  lang,
  productId,
  variantId,
}: {
  lang: Locale;
  productId: string;
  variantId: string;
}) {
  const messages = useMessages();
  const stockMessages = messages.stock;
  const searchParams = useSearchParams();
  const page = pageNumber(searchParams.get('page'));
  const productStock = useMyStock({ productId, limit: PRODUCT_VARIANTS });
  const history = useStockHistory(variantId, { page, limit: PAGE_SIZE });
  const dictionaries = useDictionaries();

  if (productStock.isPending) return <LoadingBlock messages={messages} />;
  if (productStock.isError) {
    return (
      <PartError
        error={productStock.error}
        onRetry={() => void productStock.refetch()}
        messages={messages}
      />
    );
  }
  const row = productStock.data.items.find((item) => item.variantId === variantId);
  if (!row) return <VariantNotFound lang={lang} />;
  const name = variantName(row, dictionaries.data?.sizes, dictionaries.data?.colours);

  return (
    <div className="grid gap-5">
      <Breadcrumbs
        label={messages.nav.breadcrumbs}
        items={[
          { label: stockMessages.title, href: myStockPath(lang) },
          { label: name, href: variantStockPath(lang, productId, variantId) },
          { label: stockMessages.history },
        ]}
      />
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">
        {fill(stockMessages.historyTitle, { variant: name })}
      </h1>
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
            caption={fill(stockMessages.historyTitle, { variant: name })}
          />
          <Pagination
            page={page}
            limit={PAGE_SIZE}
            total={history.data.total}
            hrefFor={(pageToShow) =>
              withQuery(stockHistoryPath(lang, productId, variantId), {
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
