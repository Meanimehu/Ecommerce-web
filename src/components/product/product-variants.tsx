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
import { useToast } from '@/components/common/toast';
import { ErrorSummary } from '@/components/form/error-summary';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { applyServerError, useAppForm } from '@/hooks/use-app-form';
import { useDeleteVariant, useSaveVariant } from '@/hooks/use-product';
import { fill, messageFor, requestIdOf, toAppError } from '@/lib/errors';
import { getMessages, type Locale, type Messages } from '@/lib/i18n';
import { paiseToRupees, rupeesToPaise, VariantFormSchema, type Dictionaries, type ProductView, type Variant, type VariantInput } from '@/types/product';
import { formatRupees } from '@/utils/format';

/**
 * Step 3, variants (Document 5, section 7.3; approved Stage 5): one row per size and colour with SKU, MRP and selling
 * price. Prices are typed in rupees and sent in paise by one shared helper (D-15). There is no quantity here: stock
 * has its own screen (Slice 4; Document 8, Slice 2 notes). A variant can be switched off; it can be removed only while
 * the product has never been approved (the backend decides).
 */
export function VariantsStep({ lang, product, dictionaries }: { lang: Locale; product: ProductView; dictionaries: Dictionaries }) {
  const t = getMessages(lang);
  const p = t.product;
  const toast = useToast();
  const save = useSaveVariant(product.id);
  const removeVariant = useDeleteVariant(product.id);
  const [editing, setEditing] = useState<Variant | 'new' | null>(product.variants.length ? null : 'new');
  const sizeLabel = (code: string | null) => (code ? (dictionaries.sizes.find((s) => s.code === code)?.label ?? code) : '—');
  const colourLabel = (code: string | null) => (code ? (dictionaries.colours.find((c) => c.code === code)?.label ?? code) : '—');
  const name = (v: Variant) => [sizeLabel(v.sizeCode), colourLabel(v.colourCode), v.sku].join(', ');
  const actionError = save.error && editing === null ? save.error : removeVariant.error;

  const columns: Column<Variant>[] = [
    { key: 'sku', header: p.variant.sku, lead: true, cell: (v) => <span className="font-medium">{v.sku}</span> },
    {
      key: 'status',
      header: p.variant.status,
      lead: true,
      cell: (v) => (v.status === 'active' ? <StatusChip tone="success" label={p.variant.active} /> : <StatusChip tone="neutral" label={p.variant.inactive} />),
    },
    { key: 'size', header: p.variant.size, cell: (v) => sizeLabel(v.sizeCode) },
    { key: 'colour', header: p.variant.colour, cell: (v) => colourLabel(v.colourCode) },
    { key: 'mrp', header: p.variant.mrp, numeric: true, cell: (v) => formatRupees(v.mrpPaise) },
    { key: 'price', header: p.variant.price, numeric: true, cell: (v) => formatRupees(v.pricePaise) },
    {
      key: 'actions',
      header: t.catalogue.columns.actions,
      cell: (v) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" size="small" onClick={() => setEditing(v)}>
            {p.variant.edit}
            <span className="sr-only">: {name(v)}</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            disabled={save.isPending}
            onClick={() => save.mutate({ variantId: v.id, body: { status: v.status === 'active' ? 'inactive' : 'active' } }, { onSuccess: () => toast(p.saved) })}
          >
            {v.status === 'active' ? p.variant.switchOff : p.variant.switchOn}
            <span className="sr-only">: {name(v)}</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" size="small" disabled={removeVariant.isPending}>
                {p.variant.remove}
                <span className="sr-only">: {name(v)}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{p.variant.removeTitle}</AlertDialogTitle>
                <AlertDialogDescription>{fill(p.variant.removeBody, { name: name(v) })}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction variant="destructiveConfirm" onClick={() => removeVariant.mutate(v.id, { onSuccess: () => toast(p.variant.removed) })}>
                  {p.variant.remove}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <section aria-labelledby="variants-heading" className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <h2 id="variants-heading" className="type-h3 text-ink">
        {p.steps.variants}
      </h2>
      {product.variants.length ? (
        <DataTable rows={product.variants} columns={columns} rowKey={(v) => v.id} caption={p.steps.variants} />
      ) : editing !== 'new' ? (
        <StateBlock icon={Layers} title={p.variant.none} text={p.variant.noneText} titleAs="h3" />
      ) : null}
      {actionError ? <ErrorMessage text={messageFor(toAppError(actionError), t)} requestId={requestIdOf(actionError)} t={t} /> : null}
      {editing !== null ? (
        <VariantForm lang={lang} product={product} dictionaries={dictionaries} variant={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} canCancel={product.variants.length > 0} />
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {editing === null ? (
          <Button type="button" variant="secondary" onClick={() => setEditing('new')}>
            <Plus aria-hidden="true" />
            {p.variant.add}
          </Button>
        ) : (
          <span />
        )}
        <Button asChild>
          <Link href={`/${lang}/vendor/products/${product.id}?step=photos`} className="no-underline">
            {p.continue}
          </Link>
        </Button>
      </div>
      <p className="type-small text-muted-foreground">{p.variant.help}</p>
    </section>
  );
}

const IDS = { sizeCode: 'variant-size', colourCode: 'variant-colour', sku: 'variant-sku', mrp: 'variant-mrp', price: 'variant-price' } as const;

function VariantForm({
  lang,
  product,
  dictionaries,
  variant,
  onDone,
  canCancel,
}: {
  lang: Locale;
  product: ProductView;
  dictionaries: Dictionaries;
  variant?: Variant;
  onDone: () => void;
  canCancel: boolean;
}) {
  const t = getMessages(lang);
  const p = t.product;
  const toast = useToast();
  const save = useSaveVariant(product.id);
  const [focus, setFocus] = useState(0);
  const form = useAppForm<VariantInput, VariantInput>(VariantFormSchema, {
    sizeCode: variant?.sizeCode ?? '',
    colourCode: variant?.colourCode ?? '',
    sku: variant?.sku ?? '',
    mrp: variant ? paiseToRupees(variant.mrpPaise) : '',
    price: variant ? paiseToRupees(variant.pricePaise) : '',
  });

  const submit = form.handleSubmit(
    async (values) => {
      const dirty = form.formState.dirtyFields;
      const isNew = !variant;
      const body: Record<string, unknown> = {};
      if (isNew ? values.sizeCode !== '' : dirty.sizeCode) body.sizeCode = values.sizeCode || null;
      if (isNew ? values.colourCode !== '' : dirty.colourCode) body.colourCode = values.colourCode || null;
      if (isNew || dirty.sku) body.sku = values.sku.trim();
      if (isNew || dirty.mrp) body.mrpPaise = rupeesToPaise(values.mrp);
      if (isNew || dirty.price) body.pricePaise = rupeesToPaise(values.price);
      try {
        if (Object.keys(body).length) await save.mutateAsync({ variantId: variant?.id, body });
        toast(p.saved);
        onDone();
      } catch (raw) {
        const error = toAppError(raw);
        if (error.code === 'PRICE_INVALID' && Array.isArray(error.details?.failures)) {
          for (const failure of error.details.failures as { field?: string }[]) {
            form.setError(failure.field === 'mrpPaise' ? 'mrp' : 'price', { type: 'server', message: p.variant.priceInvalid });
          }
        } else {
          applyServerError(form, error, t, { fields: { pricePaise: 'price', mrpPaise: 'mrp' }, codes: { SKU_TAKEN: 'sku', VARIANT_DUPLICATE: 'sizeCode', DICTIONARY_VALUE_NOT_FOUND: 'sizeCode' } });
        }
        setFocus((n) => n + 1);
      }
    },
    () => setFocus((n) => n + 1),
  );

  return (
    <form method="post" noValidate className="grid gap-4 rounded-1 border border-control p-4" onSubmit={(event) => void submit(event)}>
      <h3 className="type-h4 text-ink">{variant ? p.variant.editTitle : p.variant.add}</h3>
      <ErrorSummary form={form} fieldIds={IDS} t={t} requestId={requestIdOf(save.error)} focusSignal={focus} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField form={form} name="sizeCode" id={IDS.sizeCode} label={p.variant.size} optional options={optionsOf(dictionaries.sizes, t)} t={t} />
        <SelectField form={form} name="colourCode" id={IDS.colourCode} label={p.variant.colour} optional options={optionsOf(dictionaries.colours, t)} t={t} />
      </div>
      <TextField form={form} name="sku" id={IDS.sku} label={p.variant.sku} description={p.variant.skuHelp} t={t} inputProps={{ maxLength: 64, autoCapitalize: 'characters', spellCheck: false, className: 'uppercase' }} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="mrp" id={IDS.mrp} label={p.variant.mrpLabel} description={p.variant.mrpHelp} prefix="₹" t={t} inputProps={{ inputMode: 'decimal' }} />
        <TextField form={form} name="price" id={IDS.price} label={p.variant.priceLabel} description={p.variant.priceHelp} prefix="₹" t={t} inputProps={{ inputMode: 'decimal' }} />
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {canCancel ? (
          <Button type="button" variant="quiet" disabled={save.isPending} onClick={onDone}>
            {t.common.cancel}
          </Button>
        ) : null}
        <Button type="submit" variant="secondary" loading={save.isPending}>
          {p.variant.save}
        </Button>
      </div>
    </form>
  );
}

function optionsOf(list: readonly { code: string; label: string }[], t: Messages) {
  return [{ value: '', label: t.catalogue.none }, ...list.map((item) => ({ value: item.code, label: item.label }))];
}
