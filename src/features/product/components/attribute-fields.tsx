'use client';

import type { UseFormReturn } from 'react-hook-form';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { useMessages } from '@/lib/messages-context';
import { AttributeType, type Attribute } from '@/features/catalogue/types';
import type { AttributesFormValues } from '@/features/product/types';

/**
 * One field per attribute of the category (Document 5, section 7.3): a choice is a select,
 * anything else a text field. Drawn by a product's attributes step and by a revision's attributes
 * form; each form's hook decides what is sent.
 */
const attributeFieldId = (key: string) => `attribute-${key}`;

/** Each attribute's field id, for the error summary's links. */
export function attributeFieldIds(attributes: readonly Attribute[]): Record<string, string> {
  return Object.fromEntries(
    attributes.map((attribute) => [attribute.key, attributeFieldId(attribute.key)]),
  );
}

export function AttributeFields({
  form,
  attributes,
}: {
  form: UseFormReturn<AttributesFormValues, unknown, AttributesFormValues>;
  attributes: readonly Attribute[];
}) {
  const messages = useMessages();
  return (
    <>
      {attributes.map((attribute) =>
        attribute.type === AttributeType.Choice ? (
          <SelectField
            key={attribute.key}
            form={form}
            name={attribute.key}
            id={attributeFieldId(attribute.key)}
            label={attribute.label}
            optional={!attribute.required}
            options={[
              { value: '', label: messages.form.choose },
              ...(attribute.options ?? []).map((option) => ({ value: option, label: option })),
            ]}
            messages={messages}
          />
        ) : (
          <TextField
            key={attribute.key}
            form={form}
            name={attribute.key}
            id={attributeFieldId(attribute.key)}
            label={attribute.label}
            optional={!attribute.required}
            messages={messages}
            inputProps={
              attribute.type === AttributeType.Number
                ? { inputMode: 'decimal' }
                : { maxLength: 200 }
            }
          />
        ),
      )}
    </>
  );
}
