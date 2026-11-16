'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import { fill, type AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  StockChangeFormSchema,
  StockChangeMode,
  type AdjustStockBody,
  type StockChangeFormInput,
  type StockChangeFormValues,
  type StockRow,
} from '@/features/stock/types';
import { useAdjustStock, useSetStock } from './use-stock';

/**
 * Changing one variant's stock (Document 5, section 7.4; approved Stage 5): set an exact number, or
 * add or remove units with an optional note. The screen then shows the number the backend returns,
 * never its own sum. A change whose outcome is unknown is not repeated: the stock is read again
 * and the screen says to check it (D3-03). The screen, `stock-change.tsx`, only draws.
 */
const EMPTY = { mode: StockChangeMode.Set, amount: '', note: '' };

export function useStockChangeForm(row: StockRow) {
  const messages = useMessages();
  const stockMessages = messages.stock;
  const toast = useToast();
  const setStock = useSetStock(row.variantId);
  const adjustStock = useAdjustStock(row.variantId);
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const [isOutcomeUnknown, setIsOutcomeUnknown] = useState(false);
  const form = useAppForm<StockChangeFormInput, StockChangeFormValues>(
    StockChangeFormSchema,
    EMPTY,
  );
  const mode = form.watch('mode');

  function saveChange(values: StockChangeFormValues) {
    setIsOutcomeUnknown(false);
    const amount = Number(values.amount);
    const callbacks = { onSuccess: showSaved, onError: showSaveError };
    if (values.mode === StockChangeMode.Set) {
      setStock.mutate({ quantity: amount }, callbacks);
      return;
    }
    if (amount === 0) {
      form.setError('amount', { message: stockMessages.noChange });
      focusErrorSummary();
      return;
    }
    adjustStock.mutate(adjustment(values.mode, amount, values.note), callbacks);
  }

  function showSaved(saved: StockRow) {
    toast(fill(stockMessages.saved, { count: saved.available }));
    form.reset({ ...EMPTY, mode: form.getValues('mode') });
  }

  function showSaveError(error: AppError) {
    if (error.outcomeUnknown) {
      setIsOutcomeUnknown(true);
      return;
    }
    applyServerError(form, error, messages);
    focusErrorSummary();
  }

  return {
    form,
    mode,
    saveChange,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isOutcomeUnknown,
    isSaving: setStock.isPending || adjustStock.isPending,
    requestId: (setStock.error ?? adjustStock.error)?.requestId,
  };
}

/** Add or remove as a signed number; a note only when one was written. */
export function adjustment(mode: StockChangeMode, amount: number, note: string): AdjustStockBody {
  const delta = mode === StockChangeMode.Remove ? -amount : amount;
  return note ? { delta, note } : { delta };
}
