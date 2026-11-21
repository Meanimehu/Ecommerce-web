'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import type { ReasonOutcome } from '@/hooks/use-reason-dialog';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  AddRoleFormSchema,
  UserAction,
  type AddRoleFormInput,
  type AddRoleFormValues,
  type AdminUser,
  type StaffRole,
} from '@/features/users/types';
import { useChangeUser, useGrantRole, useRemoveRole } from './use-users';

/**
 * What an admin changes on one person (Document 5, section 8.3; Document 8, Slice 5 notes): block
 * (with a reason, in the reason dialog), unblock, give a staff role and remove one. The backend
 * decides every change: it refuses blocking oneself (`CANNOT_BLOCK_SELF`) and removing the last
 * admin (`LAST_ADMIN`), and its answer shows on the page. The screen, `user-page.tsx`, only draws.
 */
export function useUserActions(user: AdminUser) {
  const messages = useMessages();
  const usersMessages = messages.users;
  const toast = useToast();
  const changeUser = useChangeUser(user.id);
  const grantRole = useGrantRole(user.id);
  const removeRole = useRemoveRole(user.id);
  const [actionError, setActionError] = useState<AppError | null>(null);
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  // No role is chosen at the start, so a role (above all "admin") is never given by one stray click.
  const addRoleForm = useAppForm<AddRoleFormInput, AddRoleFormValues>(AddRoleFormSchema, {
    role: undefined,
  });

  function showDone(message: string) {
    setActionError(null);
    toast(message);
  }

  function blockUser(reason: string, outcome: ReasonOutcome) {
    function showBlocked() {
      showDone(usersMessages.blocked);
      outcome.onSuccess();
    }
    changeUser.mutate(
      { action: UserAction.Block, reason },
      { onSuccess: showBlocked, onError: outcome.onError },
    );
  }

  function showUnblocked() {
    showDone(usersMessages.unblocked);
  }

  function unblockUser() {
    changeUser.mutate(
      { action: UserAction.Unblock },
      { onSuccess: showUnblocked, onError: setActionError },
    );
  }

  function showRoleAdded() {
    showDone(usersMessages.roleAdded);
    addRoleForm.reset({ role: undefined });
  }

  function showAddRoleError(error: AppError) {
    applyServerError(addRoleForm, error, messages);
    focusErrorSummary();
  }

  function addRole(values: AddRoleFormValues) {
    grantRole.mutate(values.role, { onSuccess: showRoleAdded, onError: showAddRoleError });
  }

  function showRoleRemoved() {
    showDone(usersMessages.roleRemoved);
  }

  function takeAwayRole(role: StaffRole) {
    removeRole.mutate(role, { onSuccess: showRoleRemoved, onError: setActionError });
  }

  return {
    blockUser,
    unblockUser,
    addRoleForm,
    addRole,
    showAddRoleCheck: focusErrorSummary,
    addRoleFocusSignal: focusSignal,
    addRoleRequestId: grantRole.error?.requestId,
    takeAwayRole,
    actionError,
    isUnblocking: changeUser.isPending,
    isAddingRole: grantRole.isPending,
    removingRole: removeRole.isPending ? removeRole.variables : undefined,
  };
}
