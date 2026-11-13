'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { TextareaField } from '@/components/form/textarea-field';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myProductsPath } from '@/lib/routes';
import { useBasicsForm } from '@/features/product/hooks/use-basics-form';
import type { Dictionaries, DictionaryCategory, ProductView } from '@/features/product/types';
import { formatRate } from '@/utils/format';

/**
 * Step 1, basics (Document 5, section 7.3): title, category, brand and description. The tax comes
 * from the category by default; a vendor may declare their own HSN code and GST rate as a pair,
 * which a moderator then confirms (area-3b-products.md, "Tax"). It only draws; what happens on save
 * is in `use-basics-form.ts`.
 */
const FIELD_IDS = {
  title: 'product-title',
  categoryId: 'product-category',
  brandId: 'product-brand',
  description: 'product-description',
  hsnCode: 'product-hsn',
  gstRateBps: 'product-gst',
} as const;

export function BasicsStep({
  lang,
  product,
  dictionaries,
}: {
  lang: Locale;
  product: ProductView | null;
  dictionaries: Dictionaries;
}) {
  const messages = useMessages();
  const productMessages = messages.product;
  const fieldMessages = productMessages.fields;
  const basicsForm = useBasicsForm({ lang, product, dictionaries });
  const { form } = basicsForm;

  return (
    <Form
      className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6"
      onSubmit={form.handleSubmit(basicsForm.saveBasics, basicsForm.showValidationErrors)}
    >
      <h2 className="type-h3 text-ink">{productMessages.steps.basics}</h2>
      <ErrorSummary
        form={form}
        fieldIds={FIELD_IDS}
        messages={messages}
        requestId={basicsForm.requestId}
        focusSignal={basicsForm.focusSignal}
      />
      <TextField
        form={form}
        name="title"
        id={FIELD_IDS.title}
        label={fieldMessages.title}
        messages={messages}
        inputProps={{ maxLength: 150 }}
      />
      <SelectField
        form={form}
        name="categoryId"
        id={FIELD_IDS.categoryId}
        label={fieldMessages.category}
        description={fieldMessages.categoryHelp}
        placeholder={messages.form.choose}
        options={basicsForm.categoryChoices.map(({ category, path }) => ({
          value: category.id,
          label: path,
        }))}
        messages={messages}
      />
      <SelectField
        form={form}
        name="brandId"
        id={FIELD_IDS.brandId}
        label={fieldMessages.brand}
        optional
        options={[
          { value: '', label: productMessages.noBrand },
          ...dictionaries.brands.map((brand) => ({ value: brand.id, label: brand.name })),
        ]}
        messages={messages}
      />
      <TextareaField
        form={form}
        name="description"
        id={FIELD_IDS.description}
        label={fieldMessages.description}
        description={fieldMessages.descriptionHelp}
        optional
        maxLength={5000}
        messages={messages}
      />
      <fieldset className="grid gap-3 rounded-1 border border-line p-4">
        <legend className="px-1 type-h4 text-ink">{fieldMessages.tax}</legend>
        <p className="type-small text-ink-2">
          <DefaultTaxText category={basicsForm.chosenCategory} />
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            form={form}
            name="hsnCode"
            id={FIELD_IDS.hsnCode}
            label={fieldMessages.hsnCode}
            options={[
              { value: '', label: productMessages.useDefault },
              ...dictionaries.hsnCodes.map((hsnCode) => ({
                value: hsnCode.code,
                label: `${hsnCode.code}, ${hsnCode.description}`,
              })),
            ]}
            messages={messages}
          />
          <SelectField
            form={form}
            name="gstRateBps"
            id={FIELD_IDS.gstRateBps}
            label={fieldMessages.gstRate}
            options={[
              { value: '', label: productMessages.useDefault },
              ...dictionaries.gstRates.map((rate) => ({
                value: String(rate.rateBps),
                label: rate.label,
              })),
            ]}
            messages={messages}
          />
        </div>
        <p className="type-small text-muted-foreground">{productMessages.taxHelp}</p>
      </fieldset>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {product ? (
          <Button asChild variant="quiet">
            <Link href={myProductsPath(lang)}>{productMessages.backToList}</Link>
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" loading={basicsForm.isSaving}>
          {productMessages.saveContinue}
        </Button>
      </div>
    </Form>
  );
}

/** What the chosen category gives as the tax, or a prompt to choose a category first. */
function DefaultTaxText({ category }: { category: DictionaryCategory | undefined }) {
  const productMessages = useMessages().product;
  if (!category) return productMessages.taxChooseCategory;
  const { hsnCode, gstRateBps } = category.effectiveTax;
  if (!hsnCode || gstRateBps === null) return productMessages.taxNoDefault;
  return fill(productMessages.taxDefault, { hsn: hsnCode, rate: formatRate(gstRateBps) });
}
