'use client';

import { useRouter } from 'next/navigation';
import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import type { AppError } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myProductPath } from '@/lib/routes';
import {
  BasicsFormSchema,
  flattenCategories,
  ProductStep,
  TaxSource,
  type BasicsFormInput,
  type BasicsFormValues,
  type ChangeProductBody,
  type CreateProductBody,
  type Dictionaries,
  type ProductContent,
  type ProductView,
} from '@/features/product/types';
import { useChangeProduct, useCreateProduct } from './use-product';

/**
 * Step 1, basics (Document 5, section 7.3): title, category, brand, description, and the vendor's
 * own tax classification if they declare one. Saving the first time creates the draft; later only
 * changed fields are sent. Either way the vendor goes on to the attributes. The screen,
 * `basics-step.tsx`, only draws.
 */
const BASICS_FIELD_ERRORS = {
  codes: {
    [BackendErrorCode.CategoryNotFound]: 'categoryId',
    [BackendErrorCode.BrandNotFound]: 'brandId',
    [BackendErrorCode.TaxInvalid]: 'hsnCode',
  },
} as const;

export function useBasicsForm({
  lang,
  product,
  dictionaries,
}: {
  lang: Locale;
  product: ProductView | null;
  dictionaries: Dictionaries;
}) {
  const messages = useMessages();
  const router = useRouter();
  const toast = useToast();
  const createProduct = useCreateProduct();
  const changeProduct = useChangeProduct(product?.id ?? '');
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<BasicsFormInput, BasicsFormValues>(
    BasicsFormSchema,
    basicsDefaults(product),
  );
  const categoryChoices = flattenCategories(dictionaries.categories);
  const chosenCategoryId = form.watch('categoryId');
  const chosenCategory = categoryChoices.find(
    (choice) => choice.category.id === chosenCategoryId,
  )?.category;

  function saveBasics(values: BasicsFormValues) {
    if (!product) {
      createProduct.mutate(newProduct(values), {
        onSuccess: (created) => showSaved(created.id),
        onError: showSaveError,
      });
      return;
    }
    const changes = changedProduct(values, form.formState.dirtyFields);
    // Nothing changed: nothing to send, so the vendor just goes on.
    if (Object.keys(changes).length === 0) {
      showSaved(product.id);
      return;
    }
    changeProduct.mutate(changes, {
      onSuccess: () => showSaved(product.id),
      onError: showSaveError,
    });
  }

  function showSaved(productId: string) {
    toast(messages.product.saved);
    router.push(myProductPath(lang, productId, ProductStep.Attributes));
  }

  function showSaveError(error: AppError) {
    applyServerError(form, error, messages, BASICS_FIELD_ERRORS);
    focusErrorSummary();
  }

  return {
    form,
    saveBasics,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    categoryChoices,
    chosenCategory,
    isSaving: createProduct.isPending || changeProduct.isPending,
    requestId: (createProduct.error ?? changeProduct.error)?.requestId,
  };
}

/**
 * The form's starting values, from a product or a revision's content: the tax fields only when the
 * vendor declared their own.
 */
export function basicsDefaults(product: ProductContent | null): BasicsFormInput {
  const isTaxDeclared = product?.taxSource === TaxSource.VendorDeclared;
  const declaredRate = isTaxDeclared ? (product?.gstRateBps ?? null) : null;
  return {
    title: product?.title ?? '',
    categoryId: product?.categoryId ?? '',
    brandId: product?.brandId ?? '',
    description: product?.description ?? '',
    hsnCode: isTaxDeclared ? (product?.hsnCode ?? '') : '',
    gstRateBps: declaredRate === null ? '' : String(declaredRate),
  };
}

/** A new draft: what is filled. The schema has already trimmed the text. */
export function newProduct(values: BasicsFormValues): CreateProductBody {
  const body: CreateProductBody = { title: values.title, categoryId: values.categoryId };
  if (values.brandId !== '') body.brandId = values.brandId;
  if (values.description !== '') body.description = values.description;
  // The tax is sent as a pair: both chosen declares it (the schema makes sure both are).
  if (values.hsnCode !== '') {
    body.hsnCode = values.hsnCode;
    body.gstRateBps = Number(values.gstRateBps);
  }
  return body;
}

/** A change: only the changed fields; an emptied one is removed with null. */
export function changedProduct(
  values: BasicsFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<BasicsFormInput>>>,
): ChangeProductBody {
  const changes: ChangeProductBody = {};
  if (dirtyFields.title) changes.title = values.title;
  if (dirtyFields.categoryId) changes.categoryId = values.categoryId;
  if (dirtyFields.brandId) changes.brandId = values.brandId || null;
  if (dirtyFields.description) changes.description = values.description || null;
  // The tax is sent as a pair: both chosen declares it; both empty goes back to the category's
  // default.
  if (dirtyFields.hsnCode || dirtyFields.gstRateBps) {
    changes.hsnCode = values.hsnCode || null;
    changes.gstRateBps = values.gstRateBps === '' ? null : Number(values.gstRateBps);
  }
  return changes;
}
