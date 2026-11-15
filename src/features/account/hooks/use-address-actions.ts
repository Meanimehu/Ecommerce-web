'use client';

import { useToast } from '@/components/common/toast';
import { useMessages } from '@/lib/messages-context';
import { useMakeDefaultAddress, useRemoveAddress } from './use-account';

/**
 * Deleting a saved address and making one the default (Document 5, section 6.5), each with a
 * success toast. A failure is shown on the page by the list, never only in a toast (Document 6,
 * 8.10), and the list is read again either way, so it shows what the backend now has.
 */
export function useAddressActions() {
  const addressMessages = useMessages().account.address;
  const toast = useToast();
  const removeAddress = useRemoveAddress();
  const makeDefaultAddress = useMakeDefaultAddress();

  /** The address an action is running on, so only its buttons wait. */
  function busyId(): string | undefined {
    if (removeAddress.isPending) return removeAddress.variables;
    if (makeDefaultAddress.isPending) return makeDefaultAddress.variables;
    return undefined;
  }

  return {
    remove: (id: string) => {
      makeDefaultAddress.reset();
      removeAddress.mutate(id, { onSuccess: () => toast(addressMessages.removed) });
    },
    makeDefault: (id: string) => {
      removeAddress.reset();
      makeDefaultAddress.mutate(id, { onSuccess: () => toast(addressMessages.defaultChanged) });
    },
    busyId: busyId(),
    error: removeAddress.error ?? makeDefaultAddress.error,
  };
}
