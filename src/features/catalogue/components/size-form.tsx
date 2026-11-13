'use client';

import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { useMessages } from '@/lib/messages-context';
import { useSizeForm } from '@/features/catalogue/hooks/use-size-form';
import { CatalogueList, SIZE_GROUPS, type Size } from '@/features/catalogue/types';
import { CatalogueFormFrame } from './catalogue-form-frame';
import { ReadOnlyValue } from './read-only-value';

/** Add or change a size. It only draws; what happens on save is in `use-size-form.ts`. */
const FIELD_IDS = {
  code: 'size-code',
  label: 'size-label',
  sizeGroup: 'size-group',
  sortOrder: 'size-order',
} as const;

export function SizeForm({ item, onDone }: { item?: Size; onDone: () => void }) {
  const messages = useMessages();
  const fieldMessages = messages.catalogue.fields;
  const sizeForm = useSizeForm({ size: item, onDone });
  const { form } = sizeForm;

  return (
    <CatalogueFormFrame
      title={
        item
          ? `${messages.catalogue.editTitle}: ${item.code}`
          : messages.catalogue.add[CatalogueList.Sizes]
      }
      form={form}
      fieldIds={FIELD_IDS}
      requestId={sizeForm.requestId}
      focusSignal={sizeForm.focusSignal}
      isSaving={sizeForm.isSaving}
      onSubmit={form.handleSubmit(sizeForm.saveSize, sizeForm.showValidationErrors)}
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
          label={fieldMessages.code}
          description={fieldMessages.sizeCodeHelp}
          messages={messages}
          inputProps={{ maxLength: 12, autoCapitalize: 'characters', className: 'uppercase' }}
        />
      )}
      <TextField
        form={form}
        name="label"
        id={FIELD_IDS.label}
        label={fieldMessages.label}
        messages={messages}
        inputProps={{ maxLength: 50 }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          form={form}
          name="sizeGroup"
          id={FIELD_IDS.sizeGroup}
          label={fieldMessages.sizeGroup}
          options={SIZE_GROUPS.map((sizeGroup) => ({
            value: sizeGroup,
            label: messages.catalogue.sizeGroups[sizeGroup],
          }))}
          messages={messages}
        />
        <TextField
          form={form}
          name="sortOrder"
          id={FIELD_IDS.sortOrder}
          label={fieldMessages.sortOrder}
          description={fieldMessages.sortOrderHelp}
          optional
          messages={messages}
          inputProps={{ inputMode: 'numeric', maxLength: 6 }}
        />
      </div>
    </CatalogueFormFrame>
  );
}
