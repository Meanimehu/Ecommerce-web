import { Ban, Check, Clock, List, PenLine, Undo2, X } from 'lucide-react';
import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import type { Messages } from '@/lib/i18n';
import { CouponRequestStatus } from '@/features/coupon/types';

/** A coupon request's status chip (Document 6, 8.7), in the vendor's words. */
const STATUS_LOOK = {
  [CouponRequestStatus.Draft]: { tone: 'neutral', icon: List },
  [CouponRequestStatus.Submitted]: { tone: 'info', icon: Clock },
  [CouponRequestStatus.ChangesRequested]: { tone: 'warning', icon: PenLine },
  [CouponRequestStatus.Approved]: { tone: 'success', icon: Check },
  [CouponRequestStatus.Rejected]: { tone: 'error', icon: X },
  [CouponRequestStatus.Withdrawn]: { tone: 'neutral', icon: Undo2 },
  [CouponRequestStatus.Declined]: { tone: 'neutral', icon: Ban },
} as const satisfies Record<CouponRequestStatus, { tone: ChipTone; icon: typeof Check }>;

export function RequestStatusChip({
  status,
  messages,
}: {
  status: CouponRequestStatus;
  messages: Messages;
}) {
  const look = STATUS_LOOK[status];
  return (
    <StatusChip tone={look.tone} icon={look.icon} label={messages.coupon.requests.status[status]} />
  );
}
