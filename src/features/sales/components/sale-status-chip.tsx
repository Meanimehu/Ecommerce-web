import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import type { Messages } from '@/lib/i18n';
import { SaleStatus } from '@/features/sales/rules';

/** A sale's status as the approved screens show it: words as well as colour (Document 6, section 9). */
const STATUS_TONES: Record<SaleStatus, ChipTone> = {
  [SaleStatus.Upcoming]: 'info',
  [SaleStatus.Active]: 'success',
  [SaleStatus.Ended]: 'neutral',
  [SaleStatus.Cancelled]: 'error',
};

export function SaleStatusChip({ status, messages }: { status: SaleStatus; messages: Messages }) {
  return <StatusChip tone={STATUS_TONES[status]} label={messages.sales.status[status]} />;
}
