'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues, type FieldValues } from 'react-hook-form';
import type { z } from 'zod';

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
