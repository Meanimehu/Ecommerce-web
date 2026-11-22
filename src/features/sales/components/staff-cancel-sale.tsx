'use client';

import { ReasonDialog } from '@/components/common/reason-dialog';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/lib/messages-context';
import type { ReasonOutcome } from '@/hooks/use-reason-dialog';
import { STAFF_CANCEL_REASON_MAX_LENGTH } from '@/features/sales/rules';

/**
 * "Cancel sale" with its reason dialog, for admins and moderators only. The list loads it only
 * for them, so the roles that only read the list do not carry the dialog's code (Document 6,
 * section 14).
 */
export function StaffCancelSale({
  name,
  isBusy,
  onCancel,
}: {
  name: string;
  isBusy: boolean;
  onCancel: (reason: string, outcome: ReasonOutcome) => void;
}) {
  const messages = useMessages();
  const salesMessages = messages.sales;
  return (
    <ReasonDialog
      messages={messages}
      trigger={
        <Button type="button" variant="secondary" size="small" loading={isBusy}>
          {salesMessages.cancel}
          <span className="sr-only">: {name}</span>
        </Button>
      }
      title={salesMessages.cancelTitle}
      body={salesMessages.staff.cancelBody}
      label={salesMessages.staff.reasonLabel}
      confirmLabel={salesMessages.cancel}
      maxLength={STAFF_CANCEL_REASON_MAX_LENGTH}
      onConfirm={onCancel}
    />
  );
}
