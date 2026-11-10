import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { fill, messageFor, type AppError } from '@/lib/errors';
import type { Messages } from '@/lib/messages';

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
