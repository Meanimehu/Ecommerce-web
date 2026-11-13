'use client';

import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  AddressType,
  VendorAddressFormSchema,
  type AddVendorAddressBody,
  type VendorAddress,
  type VendorAddressFormInput,
  type VendorAddressFormValues,
} from '@/features/vendor/types';
import { useAddVendorAddress, useUpdateVendorAddress } from './use-vendor';

/**
 * The address form's logic (Document 5, section 7.1): add a new address, or change one. The
 * screen, `address-form.tsx`, only draws.
 */

/** The phone field shows the number without the country code; the field shows "+91" before it. */
const INDIA_PREFIX = /^\+91/;

export function useVendorAddressForm({
  address,
  onDone,
}: {
  address?: VendorAddress;
  onDone: () => void;
}) {
  const messages = useMessages();
  const toast = useToast();
  const addVendorAddress = useAddVendorAddress();
  const updateVendorAddress = useUpdateVendorAddress();
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<VendorAddressFormInput, VendorAddressFormValues>(
    VendorAddressFormSchema,
    {
      type: address?.type ?? AddressType.Pickup,
      line1: address?.line1 ?? '',
      line2: address?.line2 ?? '',
      city: address?.city ?? '',
      state: address?.state ?? '',
      pincode: address?.pincode ?? '',
      contactPhone: address ? address.contactPhone.replace(INDIA_PREFIX, '') : '',
    },
  );

  function saveAddress(values: VendorAddressFormValues) {
    const callbacks = { onSuccess: showSaved, onError: showSaveError };
    const body = addressBody(values);
    if (!address) {
      addVendorAddress.mutate(body, callbacks);
      return;
    }
    // An emptied second line is removed by sending it empty.
    const changes = !values.line2 && address.line2 ? { ...body, line2: '' } : body;
    updateVendorAddress.mutate({ id: address.id, body: changes }, callbacks);
  }

  function showSaved() {
    toast(messages.vendor.address.saved);
    onDone();
  }

  function showSaveError(error: AppError) {
    applyServerError(form, error, messages);
    focusErrorSummary();
  }

  return {
    form,
    saveAddress,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isSaving: addVendorAddress.isPending || updateVendorAddress.isPending,
    requestId: (addVendorAddress.error ?? updateVendorAddress.error)?.requestId,
  };
}

/** The address as the backend takes it: the second line is left out when empty. */
export function addressBody(values: VendorAddressFormValues): AddVendorAddressBody {
  const { line2, ...rest } = values;
  return line2 ? { ...rest, line2 } : rest;
}
