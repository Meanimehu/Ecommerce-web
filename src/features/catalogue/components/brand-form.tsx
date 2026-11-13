'use client';

import { TextField } from '@/components/form/text-field';
import { useMessages } from '@/lib/messages-context';
import { useBrandForm } from '@/features/catalogue/hooks/use-brand-form';
import { CatalogueList, type Brand } from '@/features/catalogue/types';
import { CatalogueFormFrame } from './catalogue-form-frame';

/** Add or change a brand. It only draws; what happens on save is in `use-brand-form.ts`. */
const FIELD_IDS = { name: 'brand-name', slug: 'brand-slug' } as const;

export function BrandForm({ item, onDone }: { item?: Brand; onDone: () => void }) {
  const messages = useMessages();
  const fieldMessages = messages.catalogue.fields;
  const brandForm = useBrandForm({ brand: item, onDone });
  const { form } = brandForm;

  return (
    <CatalogueFormFrame
      title={
        item
          ? `${messages.catalogue.editTitle}: ${item.name}`
          : messages.catalogue.add[CatalogueList.Brands]
      }
      form={form}
      fieldIds={FIELD_IDS}
      requestId={brandForm.requestId}
      focusSignal={brandForm.focusSignal}
      isSaving={brandForm.isSaving}
      onSubmit={form.handleSubmit(brandForm.saveBrand, brandForm.showValidationErrors)}
      onCancel={onDone}
    >
      <TextField
        form={form}
        name="name"
        id={FIELD_IDS.name}
        label={fieldMessages.name}
        messages={messages}
        inputProps={{ maxLength: 100 }}
      />
      <TextField
        form={form}
        name="slug"
        id={FIELD_IDS.slug}
        label={fieldMessages.slug}
        description={fieldMessages.slugHelp}
        optional={!item}
        messages={messages}
        inputProps={{ maxLength: 100, spellCheck: false }}
      />
    </CatalogueFormFrame>
  );
}
