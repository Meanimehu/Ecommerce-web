'use client';

import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { useMessages } from '@/lib/messages-context';
import { AttributeType, type Attribute } from '@/features/catalogue/types';
import { useAttributesForm } from '@/features/product/hooks/use-attributes-form';
import type { ProductView } from '@/features/product/types';

/**
 * The attributes of the product's category, one field each: a choice is a select, anything else a
 * text field. It only draws; what happens on save is in `use-attributes-form.ts`.
 */
const attributeFieldId = (key: string) => `attribute-${key}`;

export function AttributesForm({
  product,
  attributes,
  nextStepPath,
}: {
  product: ProductView;
  attributes: readonly Attribute[];
  nextStepPath: string;
}) {
  const messages = useMessages();
  const productMessages = messages.product;
  const attributesForm = useAttributesForm({ product, attributes, nextStepPath });
  const { form } = attributesForm;
  const fieldIds = Object.fromEntries(
    attributes.map((attribute) => [attribute.key, attributeFieldId(attribute.key)]),
  );

  return (
    <Form
      className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6"
      onSubmit={form.handleSubmit(
        attributesForm.saveAttributes,
        attributesForm.showValidationErrors,
      )}
    >
      <h2 className="type-h3 text-ink">{productMessages.steps.attributes}</h2>
      <ErrorSummary
        form={form}
        fieldIds={fieldIds}
        messages={messages}
        requestId={attributesForm.requestId}
        focusSignal={attributesForm.focusSignal}
      />
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
      <p className="type-small text-muted-foreground">{productMessages.attributesHelp}</p>
      <div className="flex justify-end">
        <Button type="submit" loading={attributesForm.isSaving}>
          {productMessages.saveContinue}
        </Button>
      </div>
    </Form>
  );
}
