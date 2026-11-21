'use client';

import type { UseFormReturn } from 'react-hook-form';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { TextareaField } from '@/components/form/textarea-field';
import { fill } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { formatRate } from '@/utils/format';
import type {
  BasicsFormInput,
  BasicsFormValues,
  CategoryChoice,
  Dictionaries,
  DictionaryCategory,
} from '@/features/product/types';

/**
 * The basics fields (Document 5, section 7.3): title, category, brand, description and the
 * vendor's own tax pair. Drawn by a product's first step and by a revision's details form; each
 * form's hook decides what is sent.
 */
export interface BasicsFieldIds {
  title: string;
  categoryId: string;
  brandId: string;
  description: string;
  hsnCode: string;
  gstRateBps: string;
}

export function BasicsFields({
  form,
  fieldIds,
  categoryChoices,
  chosenCategory,
  dictionaries,
}: {
  form: UseFormReturn<BasicsFormInput, unknown, BasicsFormValues>;
  fieldIds: BasicsFieldIds;
  categoryChoices: readonly CategoryChoice[];
  chosenCategory: DictionaryCategory | undefined;
  dictionaries: Dictionaries;
}) {
  const messages = useMessages();
  const productMessages = messages.product;
  const fieldMessages = productMessages.fields;
  return (
    <>
      <TextField
        form={form}
        name="title"
        id={fieldIds.title}
        label={fieldMessages.title}
        messages={messages}
        inputProps={{ maxLength: 150 }}
      />
      <SelectField
        form={form}
        name="categoryId"
        id={fieldIds.categoryId}
        label={fieldMessages.category}
        description={fieldMessages.categoryHelp}
        placeholder={messages.form.choose}
        options={categoryChoices.map(({ category, path }) => ({
          value: category.id,
          label: path,
        }))}
        messages={messages}
      />
      <SelectField
        form={form}
        name="brandId"
        id={fieldIds.brandId}
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
        id={fieldIds.description}
        label={fieldMessages.description}
        description={fieldMessages.descriptionHelp}
        optional
        maxLength={5000}
        messages={messages}
      />
      <fieldset className="grid gap-3 rounded-1 border border-line p-4">
        <legend className="px-1 type-h4 text-ink">{fieldMessages.tax}</legend>
        <p className="type-small text-ink-2">
          <DefaultTaxText category={chosenCategory} />
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            form={form}
            name="hsnCode"
            id={fieldIds.hsnCode}
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
            id={fieldIds.gstRateBps}
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
    </>
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
