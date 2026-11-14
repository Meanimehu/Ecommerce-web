'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import type { AppError } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { vendorApplyPath } from '@/lib/routes';
import {
  ApplyStep,
  isSellerType,
  VendorDetailsFormSchema,
  type ApplyVendorBody,
  type UpdateVendorBody,
  type Vendor,
  type VendorDetailsFormInput,
  type VendorDetailsFormValues,
} from '@/features/vendor/types';
import { useApplyAsVendor, useUpdateMyVendor } from './use-vendor';

/**
 * The business details form's logic (Document 5, section 7.1). A new application is started with
 * POST /vendors/apply; after that only the fields the person changed are sent (PATCH /vendors/me).
 * The backend checks the GSTIN and the email. The screen, `details-step.tsx`, only draws.
 */

/** Where the person goes after saving: the next step, or back to the start page. */
export enum AfterSave {
  Continue = 'continue',
  Later = 'later',
}

const DETAILS_FIELD_ERRORS = { [BackendErrorCode.GstinTaken]: 'gstin' } as const;

export type DirtyDetails = Partial<Record<keyof VendorDetailsFormValues, boolean | undefined>>;

export function useVendorDetailsForm({ lang, vendor }: { lang: Locale; vendor: Vendor | null }) {
  const messages = useMessages();
  const router = useRouter();
  const toast = useToast();
  const applyAsVendor = useApplyAsVendor();
  const updateMyVendor = useUpdateMyVendor();
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<VendorDetailsFormInput, VendorDetailsFormValues>(
    VendorDetailsFormSchema,
    {
      legalName: vendor?.legalName ?? '',
      displayName: vendor?.displayName ?? '',
      gstin: vendor?.gstin ?? '',
      sellerType: vendor?.sellerType ?? '',
      contactEmail: vendor?.contactEmail ?? '',
    },
  );
  // Which button sent the form. Read when the save succeeds, so it is kept in a ref; the state
  // only shows which button is busy.
  const afterSaveRef = useRef(AfterSave.Continue);
  const [afterSave, setAfterSave] = useState(AfterSave.Continue);

  function chooseAfterSave(choice: AfterSave) {
    afterSaveRef.current = choice;
    setAfterSave(choice);
  }

  function saveDetails(values: VendorDetailsFormValues) {
    const callbacks = { onSuccess: goToNextPage, onError: showSaveError };
    if (!vendor) {
      applyAsVendor.mutate(newApplication(values), callbacks);
      return;
    }
    const changes = changedDetails(values, vendor, form.formState.dirtyFields);
    // Nothing changed: nothing to send, so go on as after a save.
    if (Object.keys(changes).length === 0) {
      goToNextPage();
      return;
    }
    updateMyVendor.mutate(changes, callbacks);
  }

  function goToNextPage() {
    toast(messages.vendor.saved);
    const nextStep = afterSaveRef.current === AfterSave.Continue ? ApplyStep.Address : undefined;
    router.push(vendorApplyPath(lang, nextStep));
  }

  function showSaveError(error: AppError) {
    applyServerError(form, error, messages, { codes: DETAILS_FIELD_ERRORS });
    focusErrorSummary();
  }

  return {
    form,
    saveDetails,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    chooseAfterSave,
    afterSave,
    isSaving: applyAsVendor.isPending || updateMyVendor.isPending,
    requestId: (applyAsVendor.error ?? updateMyVendor.error)?.requestId,
  };
}

/** A new application sends every detail; an empty GSTIN is left out. */
export function newApplication(values: VendorDetailsFormValues): ApplyVendorBody {
  return {
    legalName: values.legalName,
    displayName: values.displayName,
    ...(values.gstin ? { gstin: values.gstin } : {}),
    ...(isSellerType(values.sellerType) ? { sellerType: values.sellerType } : {}),
    contactEmail: values.contactEmail,
  };
}

/** An existing application sends only what changed; an emptied GSTIN is removed with null. */
export function changedDetails(
  values: VendorDetailsFormValues,
  vendor: Vendor,
  dirtyFields: DirtyDetails,
): UpdateVendorBody {
  const changes: UpdateVendorBody = {};
  if (dirtyFields.legalName) changes.legalName = values.legalName;
  if (dirtyFields.displayName) changes.displayName = values.displayName;
  if (dirtyFields.gstin) {
    if (values.gstin) changes.gstin = values.gstin;
    else if (vendor.gstin) changes.gstin = null;
  }
  if (dirtyFields.sellerType && isSellerType(values.sellerType)) {
    changes.sellerType = values.sellerType;
  }
  if (dirtyFields.contactEmail) changes.contactEmail = values.contactEmail;
  return changes;
}
