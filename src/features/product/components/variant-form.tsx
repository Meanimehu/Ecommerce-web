'use client';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import type { Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { useVariantForm } from '@/features/product/hooks/use-variant-form';
import type { Dictionaries, DictionaryEntry, Variant } from '@/features/product/types';

/**
 * Add or change one variant. Prices are typed in rupees. It only draws; what happens on save is in
 * `use-variant-form.ts`.
 */
const FIELD_IDS = {
  sizeCode: 'variant-size',
  colourCode: 'variant-colour',
  sku: 'variant-sku',
  mrp: 'variant-mrp',
  price: 'variant-price',
} as const;

export function VariantForm({
  productId,
  dictionaries,
  variant,
  onDone,
  canCancel,
}: {
  productId: string;
  dictionaries: Dictionaries;
  variant?: Variant;
  onDone: () => void;
  canCancel: boolean;
}) {
  const messages = useMessages();
  const variantMessages = messages.product.variant;
  const variantForm = useVariantForm({ productId, variant, onDone });
  const { form } = variantForm;

  return (
    <Form
      className="grid gap-4 rounded-1 border border-control p-4"
      onSubmit={form.handleSubmit(variantForm.saveVariant, variantForm.showValidationErrors)}
    >
      <h3 className="type-h4 text-ink">
        {variant ? variantMessages.editTitle : variantMessages.add}
      </h3>
      <ErrorSummary
        form={form}
        fieldIds={FIELD_IDS}
        messages={messages}
        requestId={variantForm.requestId}
        focusSignal={variantForm.focusSignal}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          form={form}
          name="sizeCode"
          id={FIELD_IDS.sizeCode}
          label={variantMessages.size}
          optional
          options={dictionaryOptions(dictionaries.sizes, messages)}
          messages={messages}
        />
        <SelectField
          form={form}
          name="colourCode"
          id={FIELD_IDS.colourCode}
          label={variantMessages.colour}
          optional
          options={dictionaryOptions(dictionaries.colours, messages)}
          messages={messages}
        />
      </div>
      <TextField
        form={form}
        name="sku"
        id={FIELD_IDS.sku}
        label={variantMessages.sku}
        description={variantMessages.skuHelp}
        messages={messages}
        inputProps={{
          maxLength: 64,
          autoCapitalize: 'characters',
          spellCheck: false,
          className: 'uppercase',
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="mrp"
          id={FIELD_IDS.mrp}
          label={variantMessages.mrpLabel}
          description={variantMessages.mrpHelp}
          prefix="₹"
          messages={messages}
          inputProps={{ inputMode: 'decimal' }}
        />
        <TextField
          form={form}
          name="price"
          id={FIELD_IDS.price}
          label={variantMessages.priceLabel}
          description={variantMessages.priceHelp}
          prefix="₹"
          messages={messages}
          inputProps={{ inputMode: 'decimal' }}
        />
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {canCancel ? (
          <Button type="button" variant="quiet" disabled={variantForm.isSaving} onClick={onDone}>
            {messages.common.cancel}
          </Button>
        ) : null}
        <Button type="submit" variant="secondary" loading={variantForm.isSaving}>
          {variantMessages.save}
        </Button>
      </div>
    </Form>
  );
}

function dictionaryOptions(entries: readonly DictionaryEntry[], messages: Messages) {
  return [
    { value: '', label: messages.catalogue.none },
    ...entries.map((entry) => ({ value: entry.code, label: entry.label })),
  ];
}
