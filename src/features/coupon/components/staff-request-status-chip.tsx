import { StatusChip } from '@/components/common/status-chip';
import type { Messages } from '@/lib/i18n';
import type { CouponRequestStatus } from '@/features/coupon/types';
import { REQUEST_STATUS_LOOK } from './request-status-chip';

/** A coupon request's status chip in the staff's words. */
export function StaffRequestStatusChip({
  status,
  messages,
}: {
  status: CouponRequestStatus;
  messages: Messages;
}) {
  const look = REQUEST_STATUS_LOOK[status];
  return (
    <StatusChip
      tone={look.tone}
      icon={look.icon}
      label={messages.coupon.staffRequests.status[status]}
    />
  );
}
