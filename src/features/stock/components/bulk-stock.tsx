'use client';

import { Plus, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { DataTable, type Column } from '@/components/common/data-table';
import { ErrorMessage } from '@/components/common/error-message';
import { Form } from '@/components/form/form';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackendErrorCode } from '@/lib/error-codes';
import { fill, messageFor } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myStockPath } from '@/lib/routes';
import { isSingular } from '@/utils/format';
import { useDictionaries } from '@/features/product/hooks/use-product';
import { useBulkStockForm } from '@/features/stock/hooks/use-bulk-stock-form';
import { BULK_MAX_ROWS, SKU_MAX_LENGTH, variantName, type StockRow } from '@/features/stock/types';
import { StockStateChip } from './stock-state-chip';

/**
 * The bulk update by SKU (Document 5, section 7.4; approved Stage 5): a table of SKUs and new
 * numbers, typed or pasted, sent with one button. All or nothing: when rows have problems, nothing
 * changes, a banner says so and each row shows its problem in words. After success the stock the
 * backend returns is listed. When the outcome is unknown, a "Now" column shows each SKU's stock as
 * it is now, and nothing is sent again by itself. What happens on send is in
 * `features/stock/hooks/use-bulk-stock-form.ts`.
 */
export function BulkStock({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const stockMessages = messages.stock;
  const bulkMessages = stockMessages.bulk;
  const bulk = useBulkStockForm();
  const { form, rows, problems, tableProblem, result, error, isOutcomeUnknown, stockNow } = bulk;
  const answer = useRef<HTMLDivElement>(null);

  // After each send, focus moves to what the screen now says (the banner above the table).
  useEffect(() => {
    if (bulk.answerSignal > 0) answer.current?.focus();
  }, [bulk.answerSignal]);

  const nowBySku = new Map((stockNow ?? []).map((row) => [row.sku.toUpperCase(), row.available]));
  const problemCount = problems.size;
  const shownError =
    error && !error.outcomeUnknown && error.code !== BackendErrorCode.StockBulkInvalid
      ? error
      : null;

  return (
    <div className="grid gap-5">
      <Breadcrumbs
        label={messages.nav.breadcrumbs}
        items={[
          { label: stockMessages.title, href: myStockPath(lang) },
          { label: bulkMessages.title },
        ]}
      />
      <div className="grid gap-2 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{bulkMessages.title}</h1>
        <p className="max-w-[72ch] text-ink-2">{bulkMessages.intro}</p>
      </div>
      <div ref={answer} tabIndex={-1} className="grid gap-3 outline-none">
        {tableProblem ? <Banner tone="error">{bulkMessages[tableProblem]}</Banner> : null}
        {problemCount > 0 ? (
          <Banner tone="error">
            {isSingular(problemCount)
              ? bulkMessages.failedOne
              : fill(bulkMessages.failedMany, { count: problemCount })}
          </Banner>
        ) : null}
        {isOutcomeUnknown ? <Banner tone="warning">{bulkMessages.outcomeUnknown}</Banner> : null}
        {shownError ? (
          <ErrorMessage
            text={messageFor(shownError, messages)}
            requestId={shownError.requestId}
            messages={messages}
          />
        ) : null}
        {result ? (
          <Banner tone="success">
            {isSingular(result.changed)
              ? bulkMessages.doneOne
              : fill(bulkMessages.doneMany, { count: result.changed })}
          </Banner>
        ) : null}
      </div>
      {result ? <BulkResult rows={result.items} /> : null}
      <Form className="grid gap-4" onSubmit={form.handleSubmit(bulk.sendUpdate)}>
        <div role="group" aria-label={bulkMessages.tableLabel} className="grid gap-2">
          <div
            aria-hidden="true"
            className="hidden gap-3 px-3 type-label text-ink-2 md:grid md:grid-cols-[3rem_minmax(0,1fr)_10rem_minmax(0,1fr)_2.75rem]"
          >
            <span>{bulkMessages.columns.row}</span>
            <span>{bulkMessages.columns.sku}</span>
            <span>{bulkMessages.columns.quantity}</span>
            <span>
              {isOutcomeUnknown ? bulkMessages.columns.now : bulkMessages.columns.problem}
            </span>
            <span />
          </div>
          <ol className="grid gap-2">
            {rows.fields.map((field, index) => {
              const rowNumber = index + 1;
              const problem = problems.get(index);
              const problemId = `bulk-problem-${field.id}`;
              const typedSku = form.watch(`rows.${index}.sku`).trim().toUpperCase();
              const now = isOutcomeUnknown ? nowBySku.get(typedSku) : undefined;
              return (
                <li
                  key={field.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-start gap-3 rounded-1 border border-line bg-surface p-3 md:grid-cols-[3rem_minmax(0,1fr)_10rem_minmax(0,1fr)_2.75rem] md:items-center"
                >
                  <span className="col-span-3 type-label text-ink-2 tabular-nums md:col-span-1">
                    {rowNumber}
                  </span>
                  <Input
                    aria-label={fill(bulkMessages.skuLabel, { row: rowNumber })}
                    aria-invalid={problem ? true : undefined}
                    aria-describedby={problem ? problemId : undefined}
                    maxLength={SKU_MAX_LENGTH}
                    autoComplete="off"
                    spellCheck={false}
                    className="uppercase"
                    {...form.register(`rows.${index}.sku`)}
                    onPaste={(event) => {
                      if (bulk.pasteRows(index, event.clipboardData.getData('text'))) {
                        event.preventDefault();
                      }
                    }}
                  />
                  <Input
                    aria-label={fill(bulkMessages.quantityLabel, { row: rowNumber })}
                    aria-invalid={problem ? true : undefined}
                    aria-describedby={problem ? problemId : undefined}
                    inputMode="numeric"
                    autoComplete="off"
                    {...form.register(`rows.${index}.quantity`)}
                  />
                  <Button
                    type="button"
                    variant="quiet"
                    size="small"
                    className="md:order-last"
                    disabled={rows.fields.length === 1}
                    onClick={() => bulk.removeRow(index)}
                  >
                    <X aria-hidden="true" />
                    <span className="sr-only">
                      {fill(bulkMessages.removeRow, { row: rowNumber })}
                    </span>
                  </Button>
                  <span className="col-span-3 type-small md:col-span-1">
                    {problem ? (
                      <span id={problemId} className="font-medium text-error">
                        {bulkMessages.problems[problem]}
                      </span>
                    ) : null}
                    {now !== undefined ? (
                      <span className="text-ink tabular-nums">
                        <span className="md:sr-only">{bulkMessages.columns.now}: </span>
                        {now}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={bulk.isSending}>
            {bulkMessages.send}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={rows.fields.length >= BULK_MAX_ROWS}
            onClick={bulk.addRow}
          >
            <Plus aria-hidden="true" />
            {bulkMessages.addRow}
          </Button>
        </div>
      </Form>
    </div>
  );
}

/** The stock of every variant in the update, as the backend returned it. */
function BulkResult({ rows }: { rows: readonly StockRow[] }) {
  const messages = useMessages();
  const stockMessages = messages.stock;
  const dictionaries = useDictionaries();
  const columns: Column<StockRow>[] = [
    { key: 'sku', header: stockMessages.columns.sku, lead: true, cell: (row) => row.sku },
    {
      key: 'variant',
      header: stockMessages.columns.variant,
      cell: (row) => variantName(row, dictionaries.data?.sizes, dictionaries.data?.colours),
    },
    {
      key: 'available',
      header: stockMessages.columns.available,
      numeric: true,
      cell: (row) => row.available,
    },
    {
      key: 'state',
      header: stockMessages.columns.state,
      lead: true,
      cell: (row) => <StockStateChip state={row.state} messages={messages} />,
    },
  ];
  return (
    <section aria-labelledby="bulk-result-heading" className="grid gap-3">
      <h2 id="bulk-result-heading" className="type-h3 text-ink">
        {stockMessages.bulk.resultTitle}
      </h2>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.variantId}
        caption={stockMessages.bulk.resultTitle}
      />
    </section>
  );
}
