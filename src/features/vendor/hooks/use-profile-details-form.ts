'use client';

import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  ProfileDetailsFormSchema,
  type ProfileDetailsFormInput,
  type ProfileDetailsFormValues,
  type UpdateVendorBody,
  type Vendor,
} from '@/features/vendor/types';
import { useUpdateMyVendor } from './use-vendor';

/**
 * The business profile's details form (Document 5, section 8.2): an approved vendor changes the
 * shop name and the contact email. Only what changed is sent (Document 7, 20.9); the backend checks
 * the email. The screen, `business-profile.tsx`, only draws.
 */
export type DirtyProfileDetails = Partial<
  Record<keyof ProfileDetailsFormValues, boolean | undefined>
>;

export function useProfileDetailsForm({ vendor, onDone }: { vendor: Vendor; onDone: () => void }) {
  const messages = useMessages();
  const toast = useToast();
  const updateMyVendor = useUpdateMyVendor();
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<ProfileDetailsFormInput, ProfileDetailsFormValues>(
    ProfileDetailsFormSchema,
    { displayName: vendor.displayName, contactEmail: vendor.contactEmail ?? '' },
  );

  function saveDetails(values: ProfileDetailsFormValues) {
    const changes = changedProfileDetails(values, form.formState.dirtyFields);
    // Nothing changed: nothing to send.
    if (Object.keys(changes).length === 0) {
      onDone();
      return;
    }
    updateMyVendor.mutate(changes, {
      onSuccess: () => {
        toast(messages.vendor.profile.saved);
        onDone();
      },
      onError: showSaveError,
    });
  }

  function showSaveError(error: AppError) {
    applyServerError(form, error, messages);
    focusErrorSummary();
  }

  return {
    form,
    saveDetails,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isSaving: updateMyVendor.isPending,
    requestId: updateMyVendor.error?.requestId,
  };
}

/** Only the fields the person changed. */
export function changedProfileDetails(
  values: ProfileDetailsFormValues,
  dirtyFields: DirtyProfileDetails,
): UpdateVendorBody {
  const changes: UpdateVendorBody = {};
  if (dirtyFields.displayName) changes.displayName = values.displayName;
  if (dirtyFields.contactEmail) changes.contactEmail = values.contactEmail;
  return changes;
}
