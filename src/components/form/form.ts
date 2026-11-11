'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import { fill, messageFor, type AppError } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';

/** The form basics every form uses: the form itself, server errors in the right place, and message keys. */

/**
 * Every form: React Hook Form with a Zod schema (D-04). Timing follows D6-25: a field is checked when the person leaves
 * it, never a first-time error while typing; once shown, an error clears as soon as the value is valid; the whole form
 * is checked again on submit. Focus after a failed submit goes to the error summary, not to a field (Document 5,
 * section 10), so the form never moves focus to a field by itself.
 * The schema checks only what is cheap and certain (a missing value, a wrong shape); content rules are the backend's.
 */
export function useAppForm<TValues extends FieldValues, TOutput extends FieldValues = TValues>(
  schema: z.ZodType<TOutput, TValues>,
  defaultValues: DefaultValues<TValues>,
) {
  return useForm<TValues, unknown, TOutput>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldFocusError: false,
  });
}

/**
 * Puts a backend error where Document 5, section 10 and Document 6, section 9 say it belongs:
 *   - field errors (VALIDATION_FAILED) directly under their field;
 *   - a field the screen does not have: in the summary, with the backend's field name and our general wording,
 *     and logged outside production;
 *   - a code that belongs to a field (for example OTP_INVALID on the code): under that field;
 *   - anything else: in the summary only, with the reference number (the screen passes the request id to the summary).
 */
export interface ServerErrorMap<TValues extends FieldValues> {
  /** Backend field name -> form field, when the names differ. Same-named fields are found by themselves. */
  fields?: Partial<Record<string, Path<TValues>>>;
  /** Backend error code -> the form field it belongs to. */
  codes?: Partial<Record<string, Path<TValues>>>;
}

export function applyServerError<TValues extends FieldValues>(
  form: UseFormReturn<TValues, unknown, FieldValues>,
  error: AppError,
  t: Messages,
  map: ServerErrorMap<TValues> = {},
): void {
  const known = new Set(Object.keys(form.getValues()));
  if (error.fields?.length) {
    for (const fieldError of error.fields) {
      const target = map.fields?.[fieldError.field] ?? (known.has(fieldError.field) ? (fieldError.field as Path<TValues>) : undefined);
      if (target) {
        form.setError(target, { type: 'server', message: t.errors.codes.VALIDATION_FAILED });
      } else {
        form.setError(`root.field_${fieldError.field}`, { type: 'server', message: fill(t.form.unknownField, { field: fieldError.field }) });
        if (process.env.NODE_ENV !== 'production') console.warn(`Field error for a field this form does not have: ${fieldError.field}`, fieldError.messages);
      }
    }
    return;
  }
  const field = map.codes?.[error.code];
  if (field) form.setError(field, { type: 'server', message: messageFor(error, t) });
  else form.setError('root.server', { type: 'server', message: messageFor(error, t) });
}

/**
 * Schema rules carry a message key such as "validation.phoneRequired", never text, so the same schema serves English
 * and Hindi (D-08). Anything else (a server message already in the person's language) is shown as it is.
 */
export function resolveMessage(message: string | undefined, t: Messages): string {
  if (!message) return '';
  if (message.startsWith('validation.')) {
    const text = (t.validation as Record<string, string>)[message.slice('validation.'.length)];
    if (text) return text;
  }
  return message;
}
