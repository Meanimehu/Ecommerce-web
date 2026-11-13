'use client';

import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  paiseToRupees,
  VariantFormSchema,
  type AddVariantBody,
  type ChangeVariantBody,
  type Variant,
  type VariantFormInput,
  type VariantFormValues,
} from '@/features/product/types';
import { useAddVariant, useChangeVariant } from './use-product';

/**
 * The variant form (Document 5, section 7.3): size, colour, SKU, MRP and selling price. Prices are
 * typed in rupees and sent in paise (D-15). A new variant sends what is filled; a change sends only
 * the changed fields. The screen, `variant-form.tsx`, only draws.
 */
const VARIANT_FIELD_ERRORS = {
  fields: { pricePaise: 'price', mrpPaise: 'mrp' },
  codes: {
    [BackendErrorCode.SkuTaken]: 'sku',
    [BackendErrorCode.VariantDuplicate]: 'sizeCode',
    [BackendErrorCode.DictionaryValueNotFound]: 'sizeCode',
  },
} as const;

interface PriceFailure {
  field?: string;
}

export function useVariantForm({
  productId,
  variant,
  onDone,
}: {
  productId: string;
  variant?: Variant;
  onDone: () => void;
}) {
  const messages = useMessages();
  const toast = useToast();
  const addVariant = useAddVariant(productId);
  const changeVariant = useChangeVariant(productId);
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<VariantFormInput, VariantFormValues>(VariantFormSchema, {
    sizeCode: variant?.sizeCode ?? '',
    colourCode: variant?.colourCode ?? '',
    sku: variant?.sku ?? '',
    mrp: variant ? paiseToRupees(variant.mrpPaise) : '',
    price: variant ? paiseToRupees(variant.pricePaise) : '',
  });
  const callbacks = { onSuccess: showSaved, onError: showSaveError };

  function saveVariant(values: VariantFormValues) {
    if (!variant) {
      addVariant.mutate(newVariant(values), callbacks);
      return;
    }
    const changes = changedVariant(values, form.formState.dirtyFields);
    // Nothing changed: nothing to send, so the form just closes.
    if (Object.keys(changes).length === 0) {
      showSaved();
      return;
    }
    changeVariant.mutate({ variantId: variant.id, body: changes }, callbacks);
  }

  function showSaved() {
    toast(messages.product.saved);
    onDone();
  }

  function showSaveError(error: AppError) {
    const failures = error.details?.failures;
    if (error.code === BackendErrorCode.PriceInvalid && Array.isArray(failures)) {
      showPriceErrors(failures as PriceFailure[]);
    } else {
      applyServerError(form, error, messages, VARIANT_FIELD_ERRORS);
    }
    focusErrorSummary();
  }

  // The backend names the price it refuses (for example a selling price above the MRP).
  function showPriceErrors(failures: PriceFailure[]) {
    const message = messages.product.variant.priceInvalid;
    for (const failure of failures) {
      const fieldName = failure.field === 'mrpPaise' ? 'mrp' : 'price';
      form.setError(fieldName, { type: 'server', message });
    }
  }

  return {
    form,
    saveVariant,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isSaving: addVariant.isPending || changeVariant.isPending,
    requestId: (addVariant.error ?? changeVariant.error)?.requestId,
  };
}

/** A new variant: what is filled. The schema has trimmed the SKU and turned rupees into paise. */
export function newVariant(values: VariantFormValues): AddVariantBody {
  const body: Partial<AddVariantBody> = {};
  if (values.sizeCode !== '') body.sizeCode = values.sizeCode;
  if (values.colourCode !== '') body.colourCode = values.colourCode;
  return { ...body, sku: values.sku, mrpPaise: values.mrp, pricePaise: values.price };
}

/** A change: only the changed fields; an emptied size or colour is removed with null. */
export function changedVariant(
  values: VariantFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<VariantFormInput>>>,
): ChangeVariantBody {
  const changes: ChangeVariantBody = {};
  if (dirtyFields.sizeCode) changes.sizeCode = values.sizeCode || null;
  if (dirtyFields.colourCode) changes.colourCode = values.colourCode || null;
  if (dirtyFields.sku) changes.sku = values.sku;
  if (dirtyFields.mrp) changes.mrpPaise = values.mrp;
  if (dirtyFields.price) changes.pricePaise = values.price;
  return changes;
}
