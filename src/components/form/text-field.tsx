'use client';

import { CircleAlert } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Messages } from '@/lib/i18n';
import { cn } from '@/utils/cn';
import { resolveMessage } from '@/hooks/use-app-form';

/**
 * A labelled text field (Document 6, sections 8.3 and 9). Its error sits directly under it with an icon and text, is
 * tied to it by aria-describedby, and marks it aria-invalid; the border turns to the error colour at 2 px, so the error
 * is never shown by colour alone.
 */
export function TextField<TValues extends FieldValues>({
  form,
  name,
  id,
  label,
  description,
  t,
  inputProps,
}: {
  form: UseFormReturn<TValues, unknown, FieldValues>;
  name: Path<TValues>;
  /** Stable id, also used by the error summary's link to this field. */
  id: string;
  label: string;
  description?: string;
  t: Messages;
  inputProps?: Omit<ComponentProps<typeof Input>, 'id' | 'name' | 'aria-invalid' | 'aria-describedby'>;
}) {
  const error = form.formState.errors[name];
  const errorText = error ? resolveMessage(typeof error.message === 'string' ? error.message : undefined, t) : '';
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, descriptionId].filter(Boolean).join(' ') || undefined}
        {...inputProps}
        {...form.register(name)}
        className={cn(inputProps?.className, error && 'border-2 border-destructive')}
      />
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-destructive">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{errorText}</span>
        </p>
      ) : null}
      {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
    </Field>
  );
}
