'use client';

import { Layers, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/common/data-table';
import { ErrorMessage } from '@/components/common/error-message';
import { StateBlock } from '@/components/common/state-block';
import { StatusChip } from '@/components/common/status-chip';
import { fill, messageFor } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { useVariantActions } from '@/features/product/hooks/use-variant-actions';
import {
  dictionaryLabel,
  ProductStep,
  VariantStatus,
  type Dictionaries,
  type ProductView,
  type Variant,
} from '@/features/product/types';
import { formatRupees } from '@/utils/format';
import { VariantForm } from './variant-form';

/**
 * Step 3, variants (Document 5, section 7.3; approved Stage 5): one row per size and colour with
 * SKU, MRP and selling price. There is no quantity here: stock has its own screen (Slice 4;
 * Document 8, Slice 2 notes). A variant can be switched off; it can be removed only while the
 * product has never been approved (the backend decides). It only draws; the actions are in
 * `use-variant-actions.ts`.
 */

/** Which variant the form is open for: a new one, one of the table's, or none (closed). */
type OpenForm = Variant | 'new' | null;
const NEW_VARIANT = 'new';

export function VariantsStep({
  lang,
  product,
  dictionaries,
}: {
  lang: Locale;
  product: ProductView;
  dictionaries: Dictionaries;
}) {
  const messages = useMessages();
  const productMessages = messages.product;
  const variantMessages = productMessages.variant;
  const hasVariants = product.variants.length > 0;
  const [openForm, setOpenForm] = useState<OpenForm>(hasVariants ? null : NEW_VARIANT);
  const variantActions = useVariantActions({
    productId: product.id,
    isFormOpen: openForm !== null,
  });
  const { actionError } = variantActions;
  const variantName = (variant: Variant) =>
    [
      dictionaryLabel(dictionaries.sizes, variant.sizeCode),
      dictionaryLabel(dictionaries.colours, variant.colourCode),
      variant.sku,
    ].join(', ');

  const columns: Column<Variant>[] = [
    {
      key: 'sku',
      header: variantMessages.sku,
      lead: true,
      cell: (variant) => <span className="font-medium">{variant.sku}</span>,
    },
    {
      key: 'status',
      header: variantMessages.status,
      lead: true,
      cell: (variant) => <VariantStatusChip status={variant.status} />,
    },
    {
      key: 'size',
      header: variantMessages.size,
      cell: (variant) => dictionaryLabel(dictionaries.sizes, variant.sizeCode),
    },
    {
      key: 'colour',
      header: variantMessages.colour,
      cell: (variant) => dictionaryLabel(dictionaries.colours, variant.colourCode),
    },
    {
      key: 'mrp',
      header: variantMessages.mrp,
      numeric: true,
      cell: (variant) => formatRupees(variant.mrpPaise),
    },
    {
      key: 'price',
      header: variantMessages.price,
      numeric: true,
      cell: (variant) => formatRupees(variant.pricePaise),
    },
    {
      key: 'actions',
      header: messages.catalogue.columns.actions,
      cell: (variant) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => setOpenForm(variant)}
          >
            {variantMessages.edit}
            <span className="sr-only">: {variantName(variant)}</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            disabled={variantActions.isSwitching}
            onClick={() => variantActions.switchVariant(variant)}
          >
            {variant.status === VariantStatus.Active
              ? variantMessages.switchOff
              : variantMessages.switchOn}
            <span className="sr-only">: {variantName(variant)}</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                size="small"
                disabled={variantActions.isRemoving}
              >
                {variantMessages.remove}
                <span className="sr-only">: {variantName(variant)}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{variantMessages.removeTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {fill(variantMessages.removeBody, { name: variantName(variant) })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructiveConfirm"
                  onClick={() => variantActions.removeVariant(variant.id)}
                >
                  {variantMessages.remove}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <section
      aria-labelledby="variants-heading"
      className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="variants-heading" className="type-h3 text-ink">
        {productMessages.steps.variants}
      </h2>
      {hasVariants ? (
        <DataTable
          rows={product.variants}
          columns={columns}
          rowKey={(variant) => variant.id}
          caption={productMessages.steps.variants}
        />
      ) : null}
      {!hasVariants && openForm !== NEW_VARIANT ? (
        <StateBlock
          icon={Layers}
          title={variantMessages.none}
          text={variantMessages.noneText}
          titleAs="h3"
        />
      ) : null}
      {actionError ? (
        <ErrorMessage
          text={messageFor(actionError, messages)}
          requestId={actionError.requestId}
          messages={messages}
        />
      ) : null}
      {openForm !== null ? (
        <VariantForm
          productId={product.id}
          dictionaries={dictionaries}
          variant={openForm === NEW_VARIANT ? undefined : openForm}
          onDone={() => setOpenForm(null)}
          canCancel={hasVariants}
        />
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {openForm === null ? (
          <Button type="button" variant="secondary" onClick={() => setOpenForm(NEW_VARIANT)}>
            <Plus aria-hidden="true" />
            {variantMessages.add}
          </Button>
        ) : (
          <span />
        )}
        <Button asChild>
          <Link
            href={`/${lang}/vendor/products/${product.id}?step=${ProductStep.Photos}`}
            className="no-underline"
          >
            {productMessages.continue}
          </Link>
        </Button>
      </div>
      <p className="type-small text-muted-foreground">{variantMessages.help}</p>
    </section>
  );
}

function VariantStatusChip({ status }: { status: VariantStatus }) {
  const variantMessages = useMessages().product.variant;
  if (status === VariantStatus.Active) {
    return <StatusChip tone="success" label={variantMessages.active} />;
  }
  return <StatusChip tone="neutral" label={variantMessages.inactive} />;
}
