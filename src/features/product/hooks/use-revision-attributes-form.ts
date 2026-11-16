'use client';

import { useToast } from '@/components/common/toast';
import { useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import type { Attribute } from '@/features/catalogue/types';
import {
  attributesFormSchema,
  type AttributesFormValues,
  type ProductView,
  type Revision,
} from '@/features/product/types';
import { applyAttributesError, attributeDefaults, attributeValues } from './use-attributes-form';
import { useChangeRevision } from './use-product';

/**
 * A revision's attributes (Document 5, section 7.3): one field per attribute of the proposed
 * category, starting from the revision's values, or the live product's. The backend replaces all
 * values, so every filled one is sent, but only when something changed. The screen,
 * `revision-editor.tsx`, only draws.
 */
export function useRevisionAttributesForm({
  product,
  revision,
  attributes,
}: {
  product: ProductView;
  revision: Revision | null;
  attributes: readonly Attribute[];
}) {
  const messages = useMessages();
  const toast = useToast();
  const changeRevision = useChangeRevision(product.id);
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<AttributesFormValues, AttributesFormValues>(
    attributesFormSchema(attributes),
    attributeDefaults(revision?.content.attributes ?? product.attributes, attributes),
  );

  function saveAttributes(values: AttributesFormValues) {
    if (!form.formState.isDirty) return;
    changeRevision.mutate(
      { attributes: attributeValues(values, attributes) },
      { onSuccess: showSaved, onError: showSaveError },
    );
  }

  function showSaved() {
    toast(messages.product.revision.saved);
    form.reset(form.getValues());
  }

  function showSaveError(error: AppError) {
    applyAttributesError(form, error, attributes, messages);
    focusErrorSummary();
  }

  return {
    form,
    saveAttributes,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isSaving: changeRevision.isPending,
    requestId: changeRevision.error?.requestId,
  };
}
