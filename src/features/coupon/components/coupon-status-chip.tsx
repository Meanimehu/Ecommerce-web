import { Check, Clock, Pause } from 'lucide-react';
import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import type { Messages } from '@/lib/i18n';
import { CouponStatus } from '@/features/coupon/types';

/** The coupon status chip (Document 6, 8.7): Active, Waiting for the vendor, Disabled. */
const STATUS_LOOK = {
  [CouponStatus.Active]: { tone: 'success', icon: Check },
  [CouponStatus.PendingVendor]: { tone: 'warning', icon: Clock },
  [CouponStatus.Disabled]: { tone: 'neutral', icon: Pause },
} as const satisfies Record<CouponStatus, { tone: ChipTone; icon: typeof Check }>;

export function CouponStatusChip({
  status,
  messages,
}: {
  status: CouponStatus;
  messages: Messages;
}) {
  const look = STATUS_LOOK[status];
  return <StatusChip tone={look.tone} icon={look.icon} label={messages.coupon.status[status]} />;
}
