'use client';

import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { StateBlock } from '@/components/common/state-block';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { TextField } from '@/components/form/text-field';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Radio } from '@/components/ui/radio';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myStockPath, stockHistoryPath } from '@/lib/routes';
import { useDictionaries } from '@/features/product/hooks/use-product';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { VendorStatus } from '@/features/vendor/types';
import { useMyStock, useStockSummary } from '@/features/stock/hooks/use-stock';
import { useStockChangeForm } from '@/features/stock/hooks/use-stock-change-form';
import { useThresholdForm } from '@/features/stock/hooks/use-threshold-form';
import {
  DEFAULT_THRESHOLD,
  NOTE_MAX_LENGTH,
  STOCK_CHANGE_MODES,
  StockChangeMode,
  variantName,
  type StockRow,
} from '@/features/stock/types';
import { StockStateChip } from './stock-state-chip';

/**
 * Change one variant's stock (Document 5, section 7.4; approved Stage 5): what is available now and
 * its state, then set an exact number or add or remove units, with a note for the history; and the
 * low-stock threshold. After a save the screen shows what the backend returns. Only an approved
 * vendor sees the forms; others read the variant only. The variant's row is found in its product's
 * stock (GET /vendors/me/inventory?productId=…), as the backend has no call for one variant.
 */
const PRODUCT_VARIANTS = 100;

export function StockChange({
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
  const productStock = useMyStock({ productId, limit: PRODUCT_VARIANTS });
  const dictionaries = useDictionaries();
  const isApproved = useMyVendor().data?.status === VendorStatus.Approved;

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
    <div className="grid max-w-[720px] gap-5">
      <Breadcrumbs
        label={messages.nav.breadcrumbs}
        items={[{ label: stockMessages.title, href: myStockPath(lang) }, { label: name }]}
      />
      <div className="grid gap-2 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{stockMessages.changeTitle}</h1>
        <p className="text-ink">{name}</p>
        <p className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-ink tabular-nums">
            {fill(stockMessages.availableNow, { count: row.available })}
          </span>
          <StockStateChip state={row.state} messages={messages} />
        </p>
        <p className="type-small text-ink-2">{row.sku}</p>
      </div>
      {isApproved ? (
        <>
          <ChangeForm row={row} />
          <ThresholdForm row={row} />
        </>
      ) : (
        <ThresholdNow row={row} />
      )}
      <div>
        <Link
          href={stockHistoryPath(lang, row.productId, row.variantId)}
          className="inline-flex min-h-11 items-center underline underline-offset-4"
        >
          {stockMessages.seeHistory}
        </Link>
      </div>
    </div>
  );
}

export function VariantNotFound({ lang }: { lang: Locale }) {
  const stockMessages = useMessages().stock;
  return (
    <StateBlock icon={SearchX} title={stockMessages.notFound} text={stockMessages.notFoundText}>
      <Button asChild variant="secondary">
        <Link href={myStockPath(lang)} className="no-underline">
          {stockMessages.backToStock}
        </Link>
      </Button>
    </StateBlock>
  );
}

const SECTION_CLASS = 'grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6';
const CHANGE_FIELD_IDS = { amount: 'stock-amount', note: 'stock-note' } as const;

function ChangeForm({ row }: { row: StockRow }) {
  const messages = useMessages();
  const stockMessages = messages.stock;
  const change = useStockChangeForm(row);
  const { form, mode, saveChange, showValidationErrors, isSaving } = change;

  return (
    <Form className={SECTION_CLASS} onSubmit={form.handleSubmit(saveChange, showValidationErrors)}>
      {change.isOutcomeUnknown ? (
        <Banner tone="warning">{stockMessages.outcomeUnknown}</Banner>
      ) : null}
      <ErrorSummary
        form={form}
        fieldIds={CHANGE_FIELD_IDS}
        messages={messages}
        requestId={change.requestId}
        focusSignal={change.focusSignal}
      />
      <fieldset className="grid gap-2">
        <legend className="mb-2 type-label text-ink">{stockMessages.howToChange}</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {STOCK_CHANGE_MODES.map((choice) => (
            <label key={choice} className="flex min-h-11 cursor-pointer items-center gap-3">
              <Radio value={choice} {...form.register('mode')} />
              <span className="text-ink">{stockMessages.modes[choice]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <TextField
        form={form}
        name="amount"
        id={CHANGE_FIELD_IDS.amount}
        label={stockMessages.amount[mode]}
        messages={messages}
        inputProps={{ inputMode: 'numeric', autoComplete: 'off', className: 'max-w-48' }}
      />
      {mode === StockChangeMode.Set ? null : (
        <TextField
          form={form}
          name="note"
          id={CHANGE_FIELD_IDS.note}
          label={stockMessages.note}
          description={stockMessages.noteHelp}
          optional
          messages={messages}
          inputProps={{ maxLength: NOTE_MAX_LENGTH }}
        />
      )}
      <div>
        <Button type="submit" loading={isSaving}>
          {stockMessages.save}
        </Button>
      </div>
    </Form>
  );
}

const THRESHOLD_FIELD_IDS = { threshold: 'stock-threshold' } as const;

function ThresholdForm({ row }: { row: StockRow }) {
  const messages = useMessages();
  const thresholdMessages = messages.stock.threshold;
  const threshold = useThresholdForm(row);
  const { form, saveThreshold, showValidationErrors, isSaving } = threshold;
  // The backend's default, from the summary; while it loads, the documented default.
  const summary = useStockSummary();
  const defaultThreshold =
    row.lowStockThreshold === null
      ? row.effectiveThreshold
      : (summary.data?.defaultThreshold ?? DEFAULT_THRESHOLD);

  return (
    <Form
      className={SECTION_CLASS}
      onSubmit={form.handleSubmit(saveThreshold, showValidationErrors)}
      aria-labelledby="threshold-heading"
    >
      <h2 id="threshold-heading" className="type-h3 text-ink">
        {thresholdMessages.title}
      </h2>
      <ThresholdNow row={row} />
      <ErrorSummary
        form={form}
        fieldIds={THRESHOLD_FIELD_IDS}
        messages={messages}
        requestId={threshold.requestId}
        focusSignal={threshold.focusSignal}
      />
      <TextField
        form={form}
        name="threshold"
        id={THRESHOLD_FIELD_IDS.threshold}
        label={thresholdMessages.label}
        description={fill(thresholdMessages.help, { count: defaultThreshold })}
        optional
        messages={messages}
        inputProps={{ inputMode: 'numeric', autoComplete: 'off', className: 'max-w-48' }}
      />
      <div>
        <Button type="submit" variant="secondary" loading={isSaving}>
          {thresholdMessages.save}
        </Button>
      </div>
    </Form>
  );
}

/** The threshold in use, in words: the vendor's own, the default, or never low. */
function ThresholdNow({ row }: { row: StockRow }) {
  const thresholdMessages = useMessages().stock.threshold;
  let text = fill(thresholdMessages.current, { count: row.effectiveThreshold });
  if (row.lowStockThreshold === null) {
    text = fill(thresholdMessages.currentDefault, { count: row.effectiveThreshold });
  } else if (row.effectiveThreshold === 0) text = thresholdMessages.never;
  return <p className="text-ink-2">{text}</p>;
}
