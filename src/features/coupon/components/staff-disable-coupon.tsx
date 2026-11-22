'use client';

import { ReasonDialog } from '@/components/common/reason-dialog';
import { Button } from '@/components/ui/button';
import type { ReasonOutcome } from '@/hooks/use-reason-dialog';
import { useMessages } from '@/lib/messages-context';
import { COUPON_REASON_MAX_LENGTH } from '@/features/coupon/types';

/**
 * "Disable" with its reason dialog, for admin and marketing only. The page loads it only for them,
 * so the roles that only read do not carry the dialog's code (Document 6, section 14).
 */
export function StaffDisableCoupon({
  code,
  isBusy,
  onDisable,
}: {
  code: string;
  isBusy: boolean;
  onDisable: (reason: string, outcome: ReasonOutcome) => void;
}) {
  const messages = useMessages();
  const staffMessages = messages.coupon.staff;
  return (
    <ReasonDialog
      messages={messages}
      trigger={
        <Button type="button" variant="destructive" loading={isBusy}>
          {staffMessages.disable}
          <span className="sr-only">: {code}</span>
        </Button>
      }
      title={staffMessages.disableTitle}
      body={staffMessages.disableBody}
      label={staffMessages.reasonLabel}
      confirmLabel={staffMessages.disable}
      maxLength={COUPON_REASON_MAX_LENGTH}
      onConfirm={onDisable}
    />
  );
}
