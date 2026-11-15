'use client';

import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  AddressFormSchema,
  type AddAddressBody,
  type Address,
  type AddressFormInput,
  type AddressFormValues,
  type UpdateAddressBody,
} from '@/features/account/types';
import { useAddAddress, useUpdateAddress } from './use-account';

/**
 * The saved-address form's logic (Document 5, section 6.5): add an address, or change one. A
 * change sends only the changed fields (Document 7, 20.9). The backend checks every field, the pin
 * code included, and its errors show next to the fields (D5-08). The screen, `address-form.tsx`,
 * only draws.
 */

/** The phone field shows the number without the country code the backend adds. */
const INDIA_PREFIX = /^\+91/;

export type DirtyAddress = Partial<Record<keyof AddressFormValues, boolean | undefined>>;

export function useAddressForm({ address, onDone }: { address?: Address; onDone: () => void }) {
  const messages = useMessages();
  const toast = useToast();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<AddressFormInput, AddressFormValues>(AddressFormSchema, {
    label: address?.label ?? '',
    name: address?.name ?? '',
    phone: address ? address.phone.replace(INDIA_PREFIX, '') : '',
    line1: address?.line1 ?? '',
    line2: address?.line2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    pincode: address?.pincode ?? '',
  });

  function saveAddress(values: AddressFormValues) {
    const callbacks = { onSuccess: showSaved, onError: showSaveError };
    if (!address) {
      addAddress.mutate(newAddress(values), callbacks);
      return;
    }
    const changes = changedAddress(values, form.formState.dirtyFields);
    // Nothing changed: nothing to send.
    if (Object.keys(changes).length === 0) {
      onDone();
      return;
    }
    updateAddress.mutate({ id: address.id, body: changes }, callbacks);
  }

  function showSaved() {
    toast(messages.account.address.saved);
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
    isSaving: addAddress.isPending || updateAddress.isPending,
    requestId: (addAddress.error ?? updateAddress.error)?.requestId,
  };
}

/** A new address as the backend takes it: the label and second line are left out when empty. */
export function newAddress(values: AddressFormValues): AddAddressBody {
  const { label, line2, ...rest } = values;
  return { ...rest, ...(label ? { label } : {}), ...(line2 ? { line2 } : {}) };
}

/**
 * The fields the person changed. An emptied label or second line is sent empty, which the backend
 * stores as none.
 */
export function changedAddress(
  values: AddressFormValues,
  dirtyFields: DirtyAddress,
): UpdateAddressBody {
  const changes: UpdateAddressBody = {};
  for (const name of Object.keys(values) as (keyof AddressFormValues)[]) {
    if (dirtyFields[name]) changes[name] = values[name];
  }
  return changes;
}
