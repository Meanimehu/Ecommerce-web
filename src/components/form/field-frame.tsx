'use client';

import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { resolveMessage } from '@/hooks/use-app-form';
import type { Messages } from '@/lib/i18n';

/**
 * What every form field shares (Document 6, sections 8.3 and 9): the label above, always visible (14/500, ink), with
 * "(optional)" after it for an optional field; the error directly under the field with an icon and text; helper text
 * below in muted. The control gets the ids to tie the label, error and help to it.
 */
export interface FieldIds {
  id: string;
  invalid: boolean;
  describedBy: string | undefined;
}

export function FieldFrame<TValues extends FieldValues>({
  form,
  name,
  id,
  label,
  description,
  optional,
  t,
  children,
}: {
  form: UseFormReturn<TValues, unknown, FieldValues>;
  name: Path<TValues>;
  id: string;
  label: string;
  description?: string;
  optional?: boolean;
  t: Messages;
  children: (ids: FieldIds) => ReactNode;
}) {
  const error = form.formState.errors[name];
  const errorText = error ? resolveMessage(typeof error.message === 'string' ? error.message : undefined, t) : '';
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="type-label text-ink">
        {label}
        {optional ? <span className="font-normal text-muted-foreground"> {t.form.optional}</span> : null}
      </label>
      {children({ id, invalid: Boolean(error), describedBy: [errorId, descriptionId].filter(Boolean).join(' ') || undefined })}
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
