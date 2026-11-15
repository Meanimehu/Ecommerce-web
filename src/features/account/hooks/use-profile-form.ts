'use client';

import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import type { User } from '@/features/auth/types';
import {
  ProfileFormSchema,
  type ProfileFormInput,
  type ProfileFormValues,
  type UpdateProfileBody,
} from '@/features/account/types';
import { useUpdateProfile } from './use-account';

/**
 * The profile form's logic (Document 5, section 6.5; D5-04): name and email, both optional. Only
 * the changed fields are sent (Document 7, 20.9). The backend checks them and its field errors
 * show next to the fields (D5-08). The screen, `profile-form.tsx`, only draws.
 */
export function useProfileForm({ user }: { user: User }) {
  const messages = useMessages();
  const toast = useToast();
  const updateProfile = useUpdateProfile();
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<ProfileFormInput, ProfileFormValues>(ProfileFormSchema, {
    name: user.name ?? '',
    email: user.email ?? '',
  });

  function saveProfile(values: ProfileFormValues) {
    const changes = changedProfile(values, form.formState.dirtyFields);
    // Nothing changed: nothing to send.
    if (Object.keys(changes).length === 0) {
      toast(messages.account.profileSaved);
      return;
    }
    updateProfile.mutate(changes, { onSuccess: showSaved, onError: showSaveError });
  }

  function showSaved(saved: User) {
    // The saved values become the form's starting point, so a second save sends only new changes.
    form.reset({ name: saved.name ?? '', email: saved.email ?? '' });
    toast(messages.account.profileSaved);
  }

  function showSaveError(error: AppError) {
    applyServerError(form, error, messages);
    focusErrorSummary();
  }

  return {
    form,
    saveProfile,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isSaving: updateProfile.isPending,
    requestId: updateProfile.error?.requestId,
  };
}

export type DirtyProfile = Partial<Record<keyof ProfileFormValues, boolean | undefined>>;

/** The fields the person changed, as the backend takes them. */
export function changedProfile(
  values: ProfileFormValues,
  dirtyFields: DirtyProfile,
): UpdateProfileBody {
  const changes: UpdateProfileBody = {};
  if (dirtyFields.name) changes.name = values.name;
  if (dirtyFields.email) changes.email = values.email;
  return changes;
}
