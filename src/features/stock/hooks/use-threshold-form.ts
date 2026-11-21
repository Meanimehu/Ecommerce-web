'use client';

import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  ThresholdFormSchema,
  type SetThresholdBody,
  type StockRow,
  type ThresholdFormInput,
  type ThresholdFormValues,
} from '@/features/stock/types';
import { useSetThreshold } from './use-stock';

/**
 * The low-stock threshold of one variant (Document 5, section 7.4): a number, 0 for never low, or
 * empty for the backend's default. Nothing is sent when the value did not change. The screen,
 * `stock-change.tsx`, only draws.
 */
export function useThresholdForm(row: StockRow) {
  const messages = useMessages();
  const toast = useToast();
  const setThreshold = useSetThreshold(row.variantId);
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<ThresholdFormInput, ThresholdFormValues>(ThresholdFormSchema, {
    threshold: thresholdText(row.lowStockThreshold),
  });

  function saveThreshold(values: ThresholdFormValues) {
    if (!form.formState.dirtyFields.threshold) return;
    setThreshold.mutate(thresholdBody(values.threshold), {
      onSuccess: showSaved,
      onError: showSaveError,
    });
  }

  function showSaved(saved: StockRow) {
    toast(messages.stock.threshold.saved);
    form.reset({ threshold: thresholdText(saved.lowStockThreshold) });
  }

  function showSaveError(error: AppError) {
    applyServerError(form, error, messages, { fields: { lowStockThreshold: 'threshold' } });
    focusErrorSummary();
  }

  return {
    form,
    saveThreshold,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isSaving: setThreshold.isPending,
    requestId: setThreshold.error?.requestId,
  };
}

/** The vendor's own threshold as typed text; none is an empty box. */
export function thresholdText(threshold: number | null): string {
  return threshold === null ? '' : String(threshold);
}

/** An empty box goes back to the default (null). */
export function thresholdBody(text: string): SetThresholdBody {
  return { lowStockThreshold: text === '' ? null : Number(text) };
}
