import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import type { Messages } from '@/lib/i18n';
import { VendorStatus } from '@/features/vendor/types';

/**
 * The vendor status chip (Document 6, 8.7): draft neutral, submitted information, approved success,
 * rejected and suspended error.
 */
const STATUS_TONES: Record<VendorStatus, ChipTone> = {
  [VendorStatus.Draft]: 'neutral',
  [VendorStatus.Submitted]: 'info',
  [VendorStatus.Approved]: 'success',
  [VendorStatus.Rejected]: 'error',
  [VendorStatus.Suspended]: 'error',
};

export function VendorStatusChip({
  status,
  messages,
}: {
  status: VendorStatus;
  messages: Messages;
}) {
  return <StatusChip tone={STATUS_TONES[status]} label={messages.vendor.status[status]} />;
}
