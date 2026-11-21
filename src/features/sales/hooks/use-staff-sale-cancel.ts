'use client';

import { useToast } from '@/components/common/toast';
import type { ReasonOutcome } from '@/hooks/use-reason-dialog';
import { useMessages } from '@/lib/messages-context';
import { useStaffCancelSale } from './use-sales';

/**
 * A staff member cancels a sale, with a reason (Document 5, section 8.3): admins and moderators
 * only, an upcoming or active sale. A refusal shows in the reason dialog and the list is read again
 * either way. The screen, `staff-sale-list.tsx`, only draws.
 */
export function useStaffSaleCancel() {
  const salesMessages = useMessages().sales;
  const toast = useToast();
  const cancelSale = useStaffCancelSale();

  function cancel(id: string, reason: string, outcome: ReasonOutcome) {
    function showCancelled() {
      toast(salesMessages.cancelled);
      outcome.onSuccess();
    }
    cancelSale.mutate({ id, reason }, { onSuccess: showCancelled, onError: outcome.onError });
  }

  return {
    cancel,
    busyId: cancelSale.isPending ? cancelSale.variables.id : undefined,
  };
}
