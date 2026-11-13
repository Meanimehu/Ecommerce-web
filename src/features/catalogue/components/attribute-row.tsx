'use client';

import type { UseFormReturn } from 'react-hook-form';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { TextareaField } from '@/components/form/textarea-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { fill } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  ATTRIBUTE_TYPES,
  AttributeType,
  type CategoryFormInput,
  type CategoryFormValues,
} from '@/features/catalogue/types';

/** One attribute of a category: key, label, type, and for a choice its options and "filterable". */
export function AttributeRow({
  index,
  form,
  onRemove,
}: {
  index: number;
  form: UseFormReturn<CategoryFormInput, unknown, CategoryFormValues>;
  onRemove: () => void;
}) {
  const messages = useMessages();
  const fieldMessages = messages.catalogue.fields;
  const isChoice = form.watch(`attributes.${index}.type`) === AttributeType.Choice;
  const number = index + 1;
  const title = fill(fieldMessages.attributeNumber, { number });

  return (
    <div role="group" aria-label={title} className="grid gap-3 rounded-1 border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="type-label text-ink">{title}</p>
        <Button type="button" variant="quiet" size="small" onClick={onRemove}>
          {fieldMessages.removeAttribute}
          <span className="sr-only"> {number}</span>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          form={form}
          name={`attributes.${index}.key`}
          id={`attribute-${index}-key`}
          label={fieldMessages.attributeKey}
          description={fieldMessages.attributeKeyHelp}
          messages={messages}
          inputProps={{ maxLength: 40, spellCheck: false }}
        />
        <TextField
          form={form}
          name={`attributes.${index}.label`}
          id={`attribute-${index}-label`}
          label={fieldMessages.attributeLabel}
          messages={messages}
          inputProps={{ maxLength: 60 }}
        />
      </div>
      <SelectField
        form={form}
        name={`attributes.${index}.type`}
        id={`attribute-${index}-type`}
        label={fieldMessages.attributeType}
        options={ATTRIBUTE_TYPES.map((attributeType) => ({
          value: attributeType,
          label: messages.catalogue.attributeTypes[attributeType],
        }))}
        messages={messages}
      />
      {isChoice ? (
        <TextareaField
          form={form}
          name={`attributes.${index}.options`}
          id={`attribute-${index}-options`}
          label={fieldMessages.attributeOptions}
          description={fieldMessages.attributeOptionsHelp}
          messages={messages}
        />
      ) : null}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
        <Checkbox {...form.register(`attributes.${index}.required`)} />
        <span>{fieldMessages.attributeRequired}</span>
      </label>
      {isChoice ? (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
          <Checkbox {...form.register(`attributes.${index}.filterable`)} />
          <span>{fieldMessages.attributeFilterable}</span>
        </label>
      ) : null}
    </div>
  );
}
