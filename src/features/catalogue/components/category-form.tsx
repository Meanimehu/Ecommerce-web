'use client';

import { Plus } from 'lucide-react';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/lib/messages-context';
import { useCategoryForm } from '@/features/catalogue/hooks/use-category-form';
import { CatalogueList, type Category } from '@/features/catalogue/types';
import { AttributeRow } from './attribute-row';
import { CatalogueFormFrame } from './catalogue-form-frame';

/**
 * Add or change a category (area-3a-catalogue.md, section 4). It only draws; what happens on save,
 * and how the backend's attribute problems are placed, is in
 * `features/catalogue/hooks/use-category-form.ts`.
 */
const FIELD_IDS = {
  name: 'category-name',
  parentId: 'category-parent',
  slug: 'category-slug',
  defaultHsnCode: 'category-hsn',
  defaultGstRateBps: 'category-gst',
  sortOrder: 'category-order',
} as const;

export function CategoryForm({ item, onDone }: { item?: Category; onDone: () => void }) {
  const messages = useMessages();
  const fieldMessages = messages.catalogue.fields;
  const categoryForm = useCategoryForm({ category: item, onDone });
  const { form, attributes } = categoryForm;

  // Field ids for the summary links, the attribute keys included.
  const fieldIds: Record<string, string> = { ...FIELD_IDS };
  attributes.fields.forEach((_field, index) => {
    fieldIds[`attributes.${index}.key`] = `attribute-${index}-key`;
  });

  return (
    <CatalogueFormFrame
      title={
        item
          ? `${messages.catalogue.editTitle}: ${item.name}`
          : messages.catalogue.add[CatalogueList.Categories]
      }
      form={form}
      fieldIds={fieldIds}
      requestId={categoryForm.requestId}
      focusSignal={categoryForm.focusSignal}
      isSaving={categoryForm.isSaving}
      onSubmit={form.handleSubmit(categoryForm.saveCategory, categoryForm.showValidationErrors)}
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
      <SelectField
        form={form}
        name="parentId"
        id={FIELD_IDS.parentId}
        label={fieldMessages.parent}
        description={fieldMessages.parentHelp}
        options={categoryForm.parentOptions}
        messages={messages}
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
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          form={form}
          name="defaultHsnCode"
          id={FIELD_IDS.defaultHsnCode}
          label={fieldMessages.defaultHsn}
          optional
          options={categoryForm.hsnOptions}
          messages={messages}
        />
        <SelectField
          form={form}
          name="defaultGstRateBps"
          id={FIELD_IDS.defaultGstRateBps}
          label={fieldMessages.defaultGst}
          optional
          options={categoryForm.gstRateOptions}
          messages={messages}
        />
      </div>
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

      <fieldset className="grid gap-3">
        <legend className="type-h4 text-ink">{fieldMessages.attributes}</legend>
        <p className="type-small text-muted-foreground">{fieldMessages.attributesHelp}</p>
        {attributes.fields.map((field, index) => (
          <AttributeRow
            key={field.id}
            index={index}
            form={form}
            onRemove={() => attributes.remove(index)}
          />
        ))}
        {categoryForm.canAddAttribute ? (
          <div>
            <Button type="button" variant="secondary" onClick={categoryForm.addAttribute}>
              <Plus aria-hidden="true" />
              {fieldMessages.addAttribute}
            </Button>
          </div>
        ) : null}
      </fieldset>
    </CatalogueFormFrame>
  );
}
