'use client';

import { CircleAlert } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { resolveMessage } from '@/hooks/use-app-form';
import type { Messages } from '@/lib/i18n';
import { cn } from '@/utils/cn';

/**
 * A labelled text field (Document 6, sections 8.3 and 9). Label above, always visible (14/500, ink). An optional prefix
 * such as "+91" sits inside the border on sunken. The error sits directly under the field with an icon and text, is tied
 * to it by aria-describedby and marks it aria-invalid; the border turns to the error colour at 2 px, so the error is never
 * shown by colour alone. Helper text below in muted.
 */
export function TextField<TValues extends FieldValues>({
  form,
  name,
  id,
  label,
  description,
  prefix,
  t,
  inputProps,
}: {
  form: UseFormReturn<TValues, unknown, FieldValues>;
  name: Path<TValues>;
  /** Stable id, also used by the error summary's link to this field. */
  id: string;
  label: string;
  description?: string;
  prefix?: string;
  t: Messages;
  inputProps?: Omit<ComponentProps<typeof Input>, 'id' | 'name' | 'aria-invalid' | 'aria-describedby'>;
}) {
  const error = form.formState.errors[name];
  const errorText = error ? resolveMessage(typeof error.message === 'string' ? error.message : undefined, t) : '';
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const input = (
    <Input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={[errorId, descriptionId].filter(Boolean).join(' ') || undefined}
      {...inputProps}
      {...form.register(name)}
      className={cn(inputProps?.className, prefix && 'h-full rounded-s-none border-0 hover:border-0 aria-invalid:border-0 aria-invalid:px-3.5 focus-visible:shadow-none')}
    />
  );
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="type-label text-ink">
        {label}
      </label>
      {prefix ? (
        <div
          data-invalid={error ? true : undefined}
          className={cn(
            'flex h-12 overflow-hidden rounded-2 border border-control bg-surface transition-colors duration-100 hover:border-ink lg:h-11',
            'focus-within:shadow-[var(--kora-ring)] data-invalid:border-2 data-invalid:border-error',
          )}
        >
          <span aria-hidden="true" className="flex items-center bg-sunken px-3 text-ink-2">
            {prefix}
          </span>
          {input}
        </div>
      ) : (
        input
      )}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 type-small text-error">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{errorText}</span>
        </p>
      ) : null}
      {description ? (
        <p id={descriptionId} className="type-small text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
