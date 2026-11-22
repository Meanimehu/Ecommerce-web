'use client';

import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { resolveMessage } from '@/hooks/use-app-form';
import type { Messages } from '@/lib/i18n';

/**
 * A ticked list of choices in a coupon form (categories, products): a labelled group of
 * checkboxes, all one field, optional, with its help and its error. Shared by the staff's coupon
 * form and the vendor's coupon request form.
 */
export function ChoiceList<TValues extends FieldValues>({
  form,
  name,
  id,
  legend,
  help,
  choices,
  empty,
  messages,
}: {
  form: UseFormReturn<TValues, unknown, FieldValues>;
  name: Path<TValues>;
  id: string;
  legend: string;
  help: string;
  choices: readonly { id: string; label: string }[];
  /** What to say when there is nothing to choose. */
  empty?: string;
  messages: Messages;
}) {
  const error = (form.formState.errors[name] as { message?: string } | undefined)?.message;
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-describedby={`${id}-help`}
      aria-invalid={error ? true : undefined}
      className="grid gap-2 outline-none"
    >
      <legend className="type-label text-ink">
        {legend} <span className="font-normal text-muted-foreground">{messages.form.optional}</span>
      </legend>
      <p id={`${id}-help`} className="type-small text-ink-2">
        {help}
      </p>
      {error ? <p className="type-small text-error">{resolveMessage(error, messages)}</p> : null}
      {choices.length === 0 && empty ? (
        <p className="type-small text-ink-2">{empty}</p>
      ) : (
        <div className="grid max-h-64 gap-1 overflow-y-auto rounded-1 border border-line p-3 sm:grid-cols-2">
          {choices.map((choice) => (
            <label
              key={choice.id}
              className="flex min-h-11 cursor-pointer items-start gap-3 text-ink"
            >
              <Checkbox value={choice.id} {...form.register(name)} />
              <span>{choice.label}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
