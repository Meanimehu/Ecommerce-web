import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import type { Messages } from '@/lib/i18n';
import type { VendorStatus } from '@/features/vendor/types';

/** The vendor status chip (Document 6, 8.7): draft neutral, submitted information, approved success, rejected and suspended error. */
const TONE: Record<VendorStatus, ChipTone> = { draft: 'neutral', submitted: 'info', approved: 'success', rejected: 'error', suspended: 'error' };

export function VendorStatusChip({ status, t }: { status: VendorStatus; t: Messages }) {
  return <StatusChip tone={TONE[status]} label={t.vendor.status[status]} />;
}

/** The application can be changed by its owner only in these statuses (area-2-vendors.md, "How the application works"). */
export const isEditable = (status: VendorStatus) => status === 'draft' || status === 'rejected';
