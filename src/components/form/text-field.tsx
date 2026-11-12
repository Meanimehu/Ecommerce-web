'use client';

import type { ComponentProps } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import type { Messages } from '@/lib/i18n';
import { cn } from '@/utils/cn';
import { FieldFrame } from './field-frame';

/**
 * A labelled text field (Document 6, sections 8.3 and 9). An optional prefix such as "+91" sits inside the border on
 * sunken. In error the border turns to the error colour at 2 px, so the error is never shown by colour alone.
 */
export function TextField<TValues extends FieldValues>({
  form,
  name,
  id,
  label,
  description,
  optional,
  prefix,
  messages,
  inputProps,
}: {
  form: UseFormReturn<TValues, unknown, FieldValues>;
  name: Path<TValues>;
  /** Stable id, also used by the error summary's link to this field. */
  id: string;
  label: string;
  description?: string;
  optional?: boolean;
  prefix?: string;
  messages: Messages;
  inputProps?: Omit<ComponentProps<typeof Input>, 'id' | 'name' | 'aria-invalid' | 'aria-describedby'>;
}) {
  return (
    <FieldFrame form={form} name={name} id={id} label={label} description={description} optional={optional} messages={messages}>
      {({ invalid, describedBy }) => {
        const input = (
          <Input
            id={id}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            {...inputProps}
            {...form.register(name)}
            className={cn(inputProps?.className, prefix && 'h-full rounded-s-none border-0 hover:border-0 aria-invalid:border-0 aria-invalid:px-3.5 focus-visible:shadow-none')}
          />
        );
        return prefix ? (
          <div
            data-invalid={invalid || undefined}
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
        );
      }}
    </FieldFrame>
  );
}
