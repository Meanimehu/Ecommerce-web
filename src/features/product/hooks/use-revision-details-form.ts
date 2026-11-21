'use client';

import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  BasicsFormSchema,
  flattenCategories,
  type BasicsFormInput,
  type BasicsFormValues,
  type Dictionaries,
  type ProductView,
  type Revision,
} from '@/features/product/types';
import { basicsDefaults, changedProduct } from './use-basics-form';
import { useChangeRevision } from './use-product';

/**
 * A revision's details (Document 5, section 7.3; area-3b-products.md, section 5): the same fields
 * and rules as a product's basics. The form starts from the revision's content, or the live
 * product's when there is no revision yet; only the changed fields are sent, and the first save
 * starts the revision. The live product does not change. The screen, `revision-editor.tsx`, only
 * draws.
 */
const DETAILS_FIELD_ERRORS = {
  codes: {
    [BackendErrorCode.CategoryNotFound]: 'categoryId',
    [BackendErrorCode.BrandNotFound]: 'brandId',
    [BackendErrorCode.TaxInvalid]: 'hsnCode',
  },
} as const;

export function useRevisionDetailsForm({
  product,
  revision,
  dictionaries,
}: {
  product: ProductView;
  revision: Revision | null;
  dictionaries: Dictionaries;
}) {
  const messages = useMessages();
  const toast = useToast();
  const changeRevision = useChangeRevision(product.id);
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<BasicsFormInput, BasicsFormValues>(
    BasicsFormSchema,
    basicsDefaults(revision?.content ?? product),
  );
  const categoryChoices = flattenCategories(dictionaries.categories);
  const chosenCategoryId = form.watch('categoryId');
  const chosenCategory = categoryChoices.find(
    (choice) => choice.category.id === chosenCategoryId,
  )?.category;

  function saveDetails(values: BasicsFormValues) {
    const changes = changedProduct(values, form.formState.dirtyFields);
    // Nothing changed: nothing to send, and no revision is started.
    if (Object.keys(changes).length === 0) return;
    changeRevision.mutate(changes, { onSuccess: showSaved, onError: showSaveError });
  }

  function showSaved() {
    toast(messages.product.revision.saved);
    // What was saved is the new starting point, so the next save sends only later changes.
    form.reset(form.getValues());
  }

  function showSaveError(error: AppError) {
    applyServerError(form, error, messages, DETAILS_FIELD_ERRORS);
    focusErrorSummary();
  }

  return {
    form,
    saveDetails,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    categoryChoices,
    chosenCategory,
    isSaving: changeRevision.isPending,
    requestId: changeRevision.error?.requestId,
  };
}
