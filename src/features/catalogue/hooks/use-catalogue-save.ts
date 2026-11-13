'use client';

import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { useToast } from '@/components/common/toast';
import { applyServerError, useErrorSummaryFocus, type ServerErrorMap } from '@/hooks/use-app-form';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import type { AddBody, ChangeBody, EditableList } from '@/features/catalogue/types';
import { useAddCatalogueItem, useChangeCatalogueItem } from './use-catalogue';

/**
 * The save steps every catalogue form takes (Document 7, 20.9: form hooks of one feature may share
 * a helper): add a new entry or change one, then a toast and close; on a refusal, the backend's
 * errors under the right fields and focus on the error summary. Each form's own hook decides what
 * it sends.
 */
export function useCatalogueSave<List extends EditableList, TValues extends FieldValues>({
  list,
  form,
  fieldErrors,
  showError,
  onDone,
}: {
  list: List;
  form: UseFormReturn<TValues, unknown, FieldValues>;
  fieldErrors?: ServerErrorMap<TValues>;
  /** A form that places some errors itself (the category's attributes) passes its own. */
  showError?: (error: AppError) => void;
  onDone: () => void;
}) {
  const messages = useMessages();
  const toast = useToast();
  const addCatalogueItem = useAddCatalogueItem(list);
  const changeCatalogueItem = useChangeCatalogueItem(list);
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const callbacks = { onSuccess: showSaved, onError: showSaveError };

  function addItem(body: AddBody<List>) {
    addCatalogueItem.mutate(body, callbacks);
  }

  function changeItem(id: string, changes: ChangeBody<List>) {
    // Nothing changed: nothing to send, so the form just closes.
    if (Object.keys(changes).length === 0) {
      onDone();
      return;
    }
    changeCatalogueItem.mutate({ id, body: changes }, callbacks);
  }

  function showSaved() {
    toast(messages.catalogue.saved);
    onDone();
  }

  function showSaveError(error: AppError) {
    if (showError) showError(error);
    else applyServerError(form, error, messages, fieldErrors);
    focusErrorSummary();
  }

  return {
    addItem,
    changeItem,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isSaving: addCatalogueItem.isPending || changeCatalogueItem.isPending,
    requestId: (addCatalogueItem.error ?? changeCatalogueItem.error)?.requestId,
  };
}
