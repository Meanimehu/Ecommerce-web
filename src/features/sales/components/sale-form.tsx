'use client';

import { Tag } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { StateBlock } from '@/components/common/state-block';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { mySalesPath } from '@/lib/routes';
import { formatRupees } from '@/utils/format';
import { useDictionaries, useMyProduct } from '@/features/product/hooks/use-product';
import { useEveryStockRow } from '@/features/stock/hooks/use-stock';
import { variantName, type StockRow } from '@/features/stock/types';
import { useSaleForm } from '@/features/sales/hooks/use-sale-form';

/**
 * A new sale (Document 5, section 8.2; approved Stage 5): the variant, its normal price, the sale
 * price in rupees, and when it starts and ends, in IST. The vendor's variants come from the stock
 * list, where every variant is; the normal price from the variant's product. It only draws; what
 * happens on save is in `use-sale-form.ts`.
 */
const FIELD_IDS = {
  variantId: 'sale-variant',
  salePrice: 'sale-price',
  startsAt: 'sale-starts',
  endsAt: 'sale-ends',
} as const;

const ACTIVE = 'active';

export function SaleForm({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const salesMessages = messages.sales;
  const everyVariant = useEveryStockRow(true);

  let content;
  if (everyVariant.isPending) content = <LoadingBlock messages={messages} />;
  else if (everyVariant.isError) {
    content = (
      <PartError
        error={everyVariant.error}
        onRetry={() => void everyVariant.refetch()}
        messages={messages}
      />
    );
  } else {
    const variants = everyVariant.data.filter((row) => row.variantStatus === ACTIVE);
    content =
      variants.length === 0 ? (
        <StateBlock icon={Tag} title={salesMessages.empty} text={salesMessages.noVariants} />
      ) : (
        <NewSaleForm lang={lang} variants={variants} />
      );
  }

  return (
    <div className="grid max-w-[720px] gap-5">
      <Breadcrumbs
        label={messages.nav.breadcrumbs}
        items={[
          { label: salesMessages.title, href: mySalesPath(lang) },
          { label: salesMessages.newSale },
        ]}
      />
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{salesMessages.newSale}</h1>
      {content}
    </div>
  );
}

function NewSaleForm({ lang, variants }: { lang: Locale; variants: readonly StockRow[] }) {
  const messages = useMessages();
  const salesMessages = messages.sales;
  const fieldMessages = salesMessages.fields;
  const dictionaries = useDictionaries();
  const saleForm = useSaleForm({ lang });
  const { form } = saleForm;
  const chosen = variants.find((row) => row.variantId === form.watch('variantId'));
  const product = useMyProduct(chosen?.productId ?? null);
  const normalPrice = product.data?.variants.find(
    (variant) => variant.id === chosen?.variantId,
  )?.pricePaise;

  return (
    <Form
      className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6"
      onSubmit={form.handleSubmit(saleForm.saveSale, saleForm.showValidationErrors)}
    >
      <ErrorSummary
        form={form}
        fieldIds={FIELD_IDS}
        messages={messages}
        requestId={saleForm.requestId}
        focusSignal={saleForm.focusSignal}
      />
      <SelectField
        form={form}
        name="variantId"
        id={FIELD_IDS.variantId}
        label={fieldMessages.variant}
        placeholder={messages.form.choose}
        options={variants.map((row) => ({
          value: row.variantId,
          label: `${variantName(row, dictionaries.data?.sizes, dictionaries.data?.colours)} (${row.sku})`,
        }))}
        messages={messages}
      />
      {normalPrice === undefined ? null : (
        <p className="text-ink">
          {fieldMessages.normalPrice}:{' '}
          <span className="font-medium tabular-nums">{formatRupees(normalPrice)}</span>
        </p>
      )}
      <TextField
        form={form}
        name="salePrice"
        id={FIELD_IDS.salePrice}
        label={fieldMessages.salePrice}
        description={fieldMessages.salePriceHelp}
        messages={messages}
        inputProps={{ inputMode: 'decimal', autoComplete: 'off', className: 'max-w-48' }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="startsAt"
          id={FIELD_IDS.startsAt}
          label={fieldMessages.startsAt}
          messages={messages}
          inputProps={{ type: 'datetime-local' }}
        />
        <TextField
          form={form}
          name="endsAt"
          id={FIELD_IDS.endsAt}
          label={fieldMessages.endsAt}
          messages={messages}
          inputProps={{ type: 'datetime-local' }}
        />
      </div>
      <p className="type-small text-ink-2">{fieldMessages.timesHelp}</p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button asChild variant="quiet">
          <Link href={mySalesPath(lang)}>{messages.common.cancel}</Link>
        </Button>
        <Button type="submit" loading={saleForm.isSaving}>
          {salesMessages.create}
        </Button>
      </div>
    </Form>
  );
}
