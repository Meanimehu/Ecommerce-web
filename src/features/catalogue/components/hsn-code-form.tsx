'use client';

import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { useMessages } from '@/lib/messages-context';
import { useHsnCodeForm } from '@/features/catalogue/hooks/use-hsn-code-form';
import { CatalogueList, type HsnCode } from '@/features/catalogue/types';
import { CatalogueFormFrame } from './catalogue-form-frame';
import { ReadOnlyValue } from './read-only-value';

/**
 * Add or change an HSN code. It only draws; what happens on save is in
 * `features/catalogue/hooks/use-hsn-code-form.ts`.
 */
const FIELD_IDS = {
  code: 'hsn-code',
  description: 'hsn-description',
  defaultGstRateBps: 'hsn-gst',
} as const;

export function HsnCodeForm({ item, onDone }: { item?: HsnCode; onDone: () => void }) {
  const messages = useMessages();
  const fieldMessages = messages.catalogue.fields;
  const hsnCodeForm = useHsnCodeForm({ hsnCode: item, onDone });
  const { form } = hsnCodeForm;

  return (
    <CatalogueFormFrame
      title={
        item
          ? `${messages.catalogue.editTitle}: ${item.code}`
          : messages.catalogue.add[CatalogueList.HsnCodes]
      }
      form={form}
      fieldIds={FIELD_IDS}
      requestId={hsnCodeForm.requestId}
      focusSignal={hsnCodeForm.focusSignal}
      isSaving={hsnCodeForm.isSaving}
      onSubmit={form.handleSubmit(hsnCodeForm.saveHsnCode, hsnCodeForm.showValidationErrors)}
      onCancel={onDone}
    >
      {item ? (
        <ReadOnlyValue
          label={fieldMessages.code}
          value={item.code}
          help={fieldMessages.codeFixed}
        />
      ) : (
        <TextField
          form={form}
          name="code"
          id={FIELD_IDS.code}
          label={fieldMessages.hsnCode}
          description={fieldMessages.hsnCodeHelp}
          messages={messages}
          inputProps={{ inputMode: 'numeric', maxLength: 8 }}
        />
      )}
      <TextField
        form={form}
        name="description"
        id={FIELD_IDS.description}
        label={fieldMessages.description}
        messages={messages}
        inputProps={{ maxLength: 300 }}
      />
      <SelectField
        form={form}
        name="defaultGstRateBps"
        id={FIELD_IDS.defaultGstRateBps}
        label={fieldMessages.defaultGst}
        optional
        options={hsnCodeForm.gstRateOptions}
        messages={messages}
      />
    </CatalogueFormFrame>
  );
}
