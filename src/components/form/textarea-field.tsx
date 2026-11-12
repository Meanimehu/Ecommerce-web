'use client';

import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { FieldFrame } from './field-frame';

/** A labelled text area (Document 6, 8.3), with a character count when the backend sets a limit. */
export function TextareaField<TValues extends FieldValues>({
  form,
  name,
  id,
  label,
  description,
  optional,
  maxLength,
  messages,
}: {
  form: UseFormReturn<TValues, unknown, FieldValues>;
  name: Path<TValues>;
  id: string;
  label: string;
  description?: string;
  optional?: boolean;
  /** The backend's limit, from the API reference. */
  maxLength?: number;
  messages: Messages;
}) {
  const value = form.watch(name);
  const count = typeof value === 'string' ? value.length : 0;
  return (
    <FieldFrame form={form} name={name} id={id} label={label} description={description} optional={optional} messages={messages}>
      {({ invalid, describedBy }) => (
        <div className="grid gap-1">
          <Textarea id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy} maxLength={maxLength} {...form.register(name)} />
          {maxLength ? <p className="justify-self-end type-caption text-muted-foreground tabular-nums">{fill(messages.form.characters, { count, max: maxLength })}</p> : null}
        </div>
      )}
    </FieldFrame>
  );
}
