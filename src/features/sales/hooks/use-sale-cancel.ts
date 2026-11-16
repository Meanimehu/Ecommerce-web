'use client';

import { useToast } from '@/components/common/toast';
import { useMessages } from '@/lib/messages-context';
import { useCancelSale } from './use-sales';

/**
 * Cancelling a sale (Document 5, section 8.2): an upcoming or active sale stops at once. A refusal
 * shows on the list, not only in a toast; the list is read again either way. The screen,
 * `sale-list.tsx`, only draws.
 */
export function useSaleCancel() {
  const salesMessages = useMessages().sales;
  const toast = useToast();
  const cancelSale = useCancelSale();

  function showCancelled() {
    toast(salesMessages.cancelled);
  }

  return {
    cancel: (id: string) => cancelSale.mutate(id, { onSuccess: showCancelled }),
    busyId: cancelSale.isPending ? cancelSale.variables : undefined,
    error: cancelSale.error,
  };
}
