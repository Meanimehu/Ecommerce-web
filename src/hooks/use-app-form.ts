'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from 'react-hook-form';
import type { z } from 'zod';
import { BackendErrorCode, type ErrorCode } from '@/lib/error-codes';
import { fill, messageFor, type AppError, type FieldError } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';

/**
 * Every form: React Hook Form with a Zod schema (D-04). A field is checked when the person leaves
 * it, and an error clears as soon as the value is valid (D6-25). After a failed submit focus goes
 * to the error summary, never to a field (Document 5, section 10). The schema checks only a missing
 * value or a wrong shape; content rules are the backend's.
 *
 * A form that changes something already saved sends only the changed fields: its form hook reads
 * `form.formState.dirtyFields` when Save is pressed (Document 7, 20.9). React Hook Form keeps that
 * list up to date only for a form that reads it while it draws, so it is read here on every draw;
 * without this it is still empty when Save is pressed, and nothing is sent.
 */
export function useAppForm<TValues extends FieldValues, TOutput extends FieldValues = TValues>(
  schema: z.ZodType<TOutput, TValues>,
  defaultValues: DefaultValues<TValues>,
) {
  const form = useForm<TValues, unknown, TOutput>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldFocusError: false,
  });
  void form.formState.dirtyFields;
  return form;
}

/**
 * Moves focus to the form's error summary after a failed submit (Document 5, section 10). Pass
 * `focusSignal` to ErrorSummary and call `focusErrorSummary` each time a submit fails.
 */
export function useErrorSummaryFocus() {
  const [focusSignal, setFocusSignal] = useState(0);
  const focusErrorSummary = useCallback(() => setFocusSignal((count) => count + 1), []);
  return { focusSignal, focusErrorSummary };
}

/**
 * Puts a backend error where it belongs (Document 5, section 10; Document 6, section 9):
 *   - field errors (VALIDATION_FAILED) under their field;
 *   - an error for a field this form does not have: in the summary, logged outside production;
 *   - a code that belongs to one field (for example OTP_INVALID on the code): under that field;
 *   - anything else: in the summary, which shows the reference number.
 */
export interface ServerErrorMap<TValues extends FieldValues> {
  /**
   * Backend field name to form field, where the names differ. Same-named fields are found without
   * it.
   */
  fields?: Partial<Record<string, Path<TValues>>>;
  /** Error code to the form field it belongs to. */
  codes?: Partial<Record<ErrorCode, Path<TValues>>>;
}

export function applyServerError<TValues extends FieldValues>(
  form: UseFormReturn<TValues, unknown, FieldValues>,
  error: AppError,
  messages: Messages,
  map: ServerErrorMap<TValues> = {},
): void {
  if (error.fields?.length) {
    showFieldErrors(form, error.fields, messages, map);
    return;
  }

  const fieldForCode = map.codes?.[error.code];
  const message = messageFor(error, messages);
  if (fieldForCode) {
    form.setError(fieldForCode, { type: 'server', message });
  } else {
    form.setError('root.server', { type: 'server', message });
  }
}

function showFieldErrors<TValues extends FieldValues>(
  form: UseFormReturn<TValues, unknown, FieldValues>,
  fieldErrors: readonly FieldError[],
  messages: Messages,
  map: ServerErrorMap<TValues>,
): void {
  const formFieldNames = new Set(Object.keys(form.getValues()));

  for (const fieldError of fieldErrors) {
    const backendName = fieldError.field;
    const sameNamedField = formFieldNames.has(backendName)
      ? (backendName as Path<TValues>)
      : undefined;
    const formField = map.fields?.[backendName] ?? sameNamedField;

    if (formField) {
      form.setError(formField, {
        type: 'server',
        message: messages.errors.codes[BackendErrorCode.ValidationFailed],
      });
      continue;
    }

    form.setError(`root.field_${backendName}`, {
      type: 'server',
      message: fill(messages.form.unknownField, { field: backendName }),
    });
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `Field error for a field this form does not have: ${backendName}`,
        fieldError.messages,
      );
    }
  }
}

/**
 * Schema rules carry a message key such as "validation.phoneRequired", never text, so one schema
 * serves English and Hindi (D-08). Anything else, such as a message already in the person's
 * language, is shown as it is.
 */
export function resolveMessage(message: string | undefined, messages: Messages): string {
  if (!message) return '';

  const keyPrefix = 'validation.';
  if (message.startsWith(keyPrefix)) {
    const validationMessages = messages.validation as Record<string, string>;
    const text = validationMessages[message.slice(keyPrefix.length)];
    if (text) return text;
  }
  return message;
}
