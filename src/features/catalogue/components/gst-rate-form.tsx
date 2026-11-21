'use client';

import { TextField } from '@/components/form/text-field';
import { useMessages } from '@/lib/messages-context';
import { useGstRateForm } from '@/features/catalogue/hooks/use-gst-rate-form';
import { CatalogueList, type GstRate } from '@/features/catalogue/types';
import { formatRate } from '@/utils/format';
import { CatalogueFormFrame } from './catalogue-form-frame';
import { ReadOnlyValue } from './read-only-value';

/**
 * Add a GST rate, or change one's label. A rate never changes once added, so it is shown, not
 * edited (area-3a-catalogue.md). It only draws; what happens on save is in `use-gst-rate-form.ts`.
 */
const FIELD_IDS = { rate: 'gst-rate', label: 'gst-label' } as const;
const LABEL_MAX_LENGTH = 30;

export function GstRateForm({ item, onDone }: { item?: GstRate; onDone: () => void }) {
  const messages = useMessages();
  const fieldMessages = messages.catalogue.fields;
  const gstRateForm = useGstRateForm({ rate: item, onDone });
  const { form } = gstRateForm;

  return (
    <CatalogueFormFrame
      title={
        item
          ? `${messages.catalogue.editTitle}: ${item.label}`
          : messages.catalogue.add[CatalogueList.GstRates]
      }
      form={form}
      fieldIds={FIELD_IDS}
      requestId={gstRateForm.requestId}
      focusSignal={gstRateForm.focusSignal}
      isSaving={gstRateForm.isSaving}
      onSubmit={form.handleSubmit(gstRateForm.saveGstRate, gstRateForm.showValidationErrors)}
      onCancel={onDone}
    >
      {item ? (
        <ReadOnlyValue
          label={fieldMessages.rate}
          value={formatRate(item.rateBps)}
          help={fieldMessages.rateFixed}
        />
      ) : (
        <TextField
          form={form}
          name="rate"
          id={FIELD_IDS.rate}
          label={fieldMessages.rate}
          description={fieldMessages.rateHelp}
          messages={messages}
          inputProps={{ inputMode: 'decimal', autoComplete: 'off', className: 'max-w-40' }}
        />
      )}
      <TextField
        form={form}
        name="label"
        id={FIELD_IDS.label}
        label={fieldMessages.label}
        description={fieldMessages.gstLabelHelp}
        optional={!item}
        messages={messages}
        inputProps={{ maxLength: LABEL_MAX_LENGTH }}
      />
    </CatalogueFormFrame>
  );
}
