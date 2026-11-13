'use client';

import { TextField } from '@/components/form/text-field';
import { useMessages } from '@/lib/messages-context';
import { useColourForm } from '@/features/catalogue/hooks/use-colour-form';
import { CatalogueList, type Colour } from '@/features/catalogue/types';
import { CatalogueFormFrame } from './catalogue-form-frame';
import { ReadOnlyValue } from './read-only-value';

/** Add or change a colour. It only draws; what happens on save is in `use-colour-form.ts`. */
const FIELD_IDS = { code: 'colour-code', label: 'colour-label', hex: 'colour-hex' } as const;

/** A full hex colour, so the swatch shows only a real colour while the person types. */
const FULL_HEX_COLOUR = /^#[0-9a-fA-F]{6}$/;

export function ColourForm({ item, onDone }: { item?: Colour; onDone: () => void }) {
  const messages = useMessages();
  const fieldMessages = messages.catalogue.fields;
  const colourForm = useColourForm({ colour: item, onDone });
  const { form } = colourForm;
  const hex = form.watch('hex');

  return (
    <CatalogueFormFrame
      title={
        item
          ? `${messages.catalogue.editTitle}: ${item.code}`
          : messages.catalogue.add[CatalogueList.Colours]
      }
      form={form}
      fieldIds={FIELD_IDS}
      requestId={colourForm.requestId}
      focusSignal={colourForm.focusSignal}
      isSaving={colourForm.isSaving}
      onSubmit={form.handleSubmit(colourForm.saveColour, colourForm.showValidationErrors)}
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
          description={fieldMessages.colourCodeHelp}
          messages={messages}
          inputProps={{ maxLength: 20, autoCapitalize: 'characters', className: 'uppercase' }}
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
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <TextField
            form={form}
            name="hex"
            id={FIELD_IDS.hex}
            label={fieldMessages.hex}
            description={fieldMessages.hexHelp}
            optional
            messages={messages}
            inputProps={{ maxLength: 7, spellCheck: false }}
          />
        </div>
        <span
          aria-hidden="true"
          className="mb-7 size-11 shrink-0 rounded-2 border border-control"
          style={FULL_HEX_COLOUR.test(hex) ? { background: hex } : undefined}
        />
      </div>
    </CatalogueFormFrame>
  );
}
