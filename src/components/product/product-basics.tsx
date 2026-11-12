'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast';
import { ErrorSummary } from '@/components/form/error-summary';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { TextareaField } from '@/components/form/textarea-field';
import { applyServerError, useAppForm } from '@/hooks/use-app-form';
import { useChangeProduct, useCreateProduct } from '@/hooks/use-product';
import { fill, requestIdOf, toAppError } from '@/lib/errors';
import { getMessages, type Locale } from '@/lib/i18n';
import { BasicsSchema, flattenCategories, type BasicsInput, type Dictionaries, type ProductView } from '@/types/product';
import { formatRate } from '@/utils/format';

/**
 * Step 1, basics (Document 5, section 7.3): title, category, brand and description. The tax comes from the category by
 * default; a vendor may declare their own HSN code and GST rate as a pair, which a moderator then confirms
 * (area-3b-products.md, "Tax"). Saving the first time creates the draft; later only changed fields are sent.
 */
const IDS = { title: 'product-title', categoryId: 'product-category', brandId: 'product-brand', description: 'product-description', hsnCode: 'product-hsn', gstRateBps: 'product-gst' } as const;

export function BasicsStep({ lang, product, dictionaries }: { lang: Locale; product: ProductView | null; dictionaries: Dictionaries }) {
  const t = getMessages(lang);
  const p = t.product;
  const router = useRouter();
  const toast = useToast();
  const create = useCreateProduct();
  const change = useChangeProduct(product?.id ?? '');
  const [focus, setFocus] = useState(0);
  const declared = product?.taxSource === 'vendor_declared';
  const form = useAppForm<BasicsInput, BasicsInput>(BasicsSchema, {
    title: product?.title ?? '',
    categoryId: product?.categoryId ?? '',
    brandId: product?.brandId ?? '',
    description: product?.description ?? '',
    hsnCode: declared ? (product?.hsnCode ?? '') : '',
    gstRateBps: declared && product?.gstRateBps !== null && product?.gstRateBps !== undefined ? String(product.gstRateBps) : '',
  });
  const categories = flattenCategories(dictionaries.categories);
  const chosen = categories.find((c) => c.category.id === form.watch('categoryId'))?.category;
  const busy = create.isPending || change.isPending;

  const submit = form.handleSubmit(
    async (values) => {
      const dirty = form.formState.dirtyFields;
      const isNew = !product;
      const body: Record<string, unknown> = {};
      if (isNew || dirty.title) body.title = values.title.trim();
      if (isNew || dirty.categoryId) body.categoryId = values.categoryId;
      if (isNew ? values.brandId !== '' : dirty.brandId) body.brandId = values.brandId || null;
      if (isNew ? values.description.trim() !== '' : dirty.description) body.description = values.description.trim() || null;
      // The tax is sent as a pair: both chosen declares it; both empty goes back to the category's default.
      if (isNew ? values.hsnCode !== '' : dirty.hsnCode || dirty.gstRateBps) {
        body.hsnCode = values.hsnCode || null;
        body.gstRateBps = values.gstRateBps === '' ? null : Number(values.gstRateBps);
      }
      try {
        if (isNew) {
          const created = await create.mutateAsync(body);
          toast(p.saved);
          router.push(`/${lang}/vendor/products/${created.id}?step=attributes`);
        } else {
          if (Object.keys(body).length) await change.mutateAsync(body);
          toast(p.saved);
          router.push(`/${lang}/vendor/products/${product.id}?step=attributes`);
        }
      } catch (error) {
        applyServerError(form, toAppError(error), t, { codes: { CATEGORY_NOT_FOUND: 'categoryId', BRAND_NOT_FOUND: 'brandId', TAX_INVALID: 'hsnCode' } });
        setFocus((n) => n + 1);
      }
    },
    () => setFocus((n) => n + 1),
  );

  const defaultTax = chosen?.effectiveTax;
  const defaultText =
    defaultTax?.hsnCode && defaultTax.gstRateBps !== null ? fill(p.taxDefault, { hsn: defaultTax.hsnCode, rate: formatRate(defaultTax.gstRateBps) }) : p.taxNoDefault;

  return (
    <form method="post" noValidate className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6" onSubmit={(event) => void submit(event)}>
      <h2 className="type-h3 text-ink">{p.steps.basics}</h2>
      <ErrorSummary form={form} fieldIds={IDS} t={t} requestId={requestIdOf(create.error ?? change.error)} focusSignal={focus} />
      <TextField form={form} name="title" id={IDS.title} label={p.fields.title} t={t} inputProps={{ maxLength: 150 }} />
      <SelectField
        form={form}
        name="categoryId"
        id={IDS.categoryId}
        label={p.fields.category}
        description={p.fields.categoryHelp}
        placeholder={t.form.choose}
        options={categories.map(({ category, path }) => ({ value: category.id, label: path }))}
        t={t}
      />
      <SelectField
        form={form}
        name="brandId"
        id={IDS.brandId}
        label={p.fields.brand}
        optional
        options={[{ value: '', label: p.noBrand }, ...dictionaries.brands.map((brand) => ({ value: brand.id, label: brand.name }))]}
        t={t}
      />
      <TextareaField form={form} name="description" id={IDS.description} label={p.fields.description} description={p.fields.descriptionHelp} optional maxLength={5000} t={t} />
      <fieldset className="grid gap-3 rounded-1 border border-line p-4">
        <legend className="px-1 type-h4 text-ink">{p.fields.tax}</legend>
        <p className="type-small text-ink-2">{chosen ? defaultText : p.taxChooseCategory}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            form={form}
            name="hsnCode"
            id={IDS.hsnCode}
            label={p.fields.hsnCode}
            options={[{ value: '', label: p.useDefault }, ...dictionaries.hsnCodes.map((code) => ({ value: code.code, label: `${code.code}, ${code.description}` }))]}
            t={t}
          />
          <SelectField
            form={form}
            name="gstRateBps"
            id={IDS.gstRateBps}
            label={p.fields.gstRate}
            options={[{ value: '', label: p.useDefault }, ...dictionaries.gstRates.map((rate) => ({ value: String(rate.rateBps), label: rate.label }))]}
            t={t}
          />
        </div>
        <p className="type-small text-muted-foreground">{p.taxHelp}</p>
      </fieldset>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {product ? (
          <Button asChild variant="quiet">
            <Link href={`/${lang}/vendor/products`}>{p.backToList}</Link>
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" loading={busy}>
          {p.saveContinue}
        </Button>
      </div>
    </form>
  );
}
