'use client';

import { useRouter } from 'next/navigation';
import type { UseFormReturn } from 'react-hook-form';
import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import type { AppError } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { AttributeType, type Attribute } from '@/features/catalogue/types';
import {
  attributesFormSchema,
  type AttributesFormValues,
  type ProductView,
} from '@/features/product/types';
import { useChangeProduct } from './use-product';

/**
 * Step 2, attributes (Document 5, section 7.3): one field per attribute of the category, its
 * parents' attributes included. Required ones may be left empty while the product is a draft; the
 * review step lists them. The backend checks each value; a value it refuses shows on its field, or
 * in the error summary when the field is not on the form. The screen, `attributes-form.tsx`, only
 * draws.
 */
interface AttributeFailure {
  key?: string;
}

export function useAttributesForm({
  product,
  attributes,
  nextStepPath,
}: {
  product: ProductView;
  attributes: readonly Attribute[];
  nextStepPath: string;
}) {
  const messages = useMessages();
  const router = useRouter();
  const toast = useToast();
  const changeProduct = useChangeProduct(product.id);
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<AttributesFormValues, AttributesFormValues>(
    attributesFormSchema(attributes),
    attributeDefaults(product.attributes, attributes),
  );

  function saveAttributes(values: AttributesFormValues) {
    changeProduct.mutate(
      { attributes: attributeValues(values, attributes) },
      { onSuccess: showSaved, onError: showSaveError },
    );
  }

  function showSaved() {
    toast(messages.product.saved);
    router.push(nextStepPath);
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
    isSaving: changeProduct.isPending,
    requestId: changeProduct.error?.requestId,
  };
}

/** The saved values (a product's or a revision's) as text for the fields; a missing one is empty. */
export function attributeDefaults(
  saved: Record<string, unknown>,
  attributes: readonly Attribute[],
): AttributesFormValues {
  const defaults: AttributesFormValues = {};
  for (const attribute of attributes) {
    const savedValue = saved[attribute.key];
    defaults[attribute.key] =
      savedValue === undefined || savedValue === null ? '' : String(savedValue);
  }
  return defaults;
}

/**
 * What is sent: the backend replaces all values, so every filled one is sent and an empty one is
 * left out. A number attribute is sent as a number.
 */
export function attributeValues(
  values: AttributesFormValues,
  attributes: readonly Attribute[],
): Record<string, string | number> {
  const filledValues: Record<string, string | number> = {};
  for (const attribute of attributes) {
    const value = values[attribute.key]?.trim() ?? '';
    if (value === '') continue;
    filledValues[attribute.key] = attribute.type === AttributeType.Number ? Number(value) : value;
  }
  return filledValues;
}

/**
 * A refused save of attributes: each value the backend refused (ATTRIBUTES_INVALID) shows on its
 * field, or in the error summary when the field is not on the form; any other error as usual.
 * Shared by the product's attributes form and a revision's.
 */
export function applyAttributesError(
  form: UseFormReturn<AttributesFormValues, unknown, AttributesFormValues>,
  error: AppError,
  attributes: readonly Attribute[],
  messages: Messages,
) {
  const failures = error.details?.failures;
  if (error.code !== BackendErrorCode.AttributesInvalid || !Array.isArray(failures)) {
    applyServerError(form, error, messages);
    return;
  }
  const message = messages.product.attributeInvalid;
  for (const failure of failures as AttributeFailure[]) {
    const isOnForm = attributes.some((attribute) => attribute.key === failure.key);
    if (failure.key && isOnForm) form.setError(failure.key, { type: 'server', message });
    else form.setError(`root.attribute_${failure.key ?? ''}`, { type: 'server', message });
  }
}
