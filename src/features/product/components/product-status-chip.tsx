import { Check, Clock, EyeOff, List, X } from 'lucide-react';
import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import type { Messages } from '@/lib/i18n';
import type { ProductStatus } from '@/features/product/types';

/** The product status chip (Document 6, 8.7): Draft, In review, Approved, Rejected, Unpublished, each with its icon. */
const LOOK = {
  draft: { tone: 'neutral', icon: List },
  submitted: { tone: 'info', icon: Clock },
  approved: { tone: 'success', icon: Check },
  rejected: { tone: 'error', icon: X },
  unpublished: { tone: 'neutral', icon: EyeOff },
} as const satisfies Record<ProductStatus, { tone: ChipTone; icon: typeof List }>;

export function ProductStatusChip({ status, t }: { status: ProductStatus; t: Messages }) {
  return <StatusChip tone={LOOK[status].tone} icon={LOOK[status].icon} label={t.product.status[status]} />;
}

/** Content, variants' codes and photos change directly only in these statuses (area-3b-products.md, "How a product moves"). */
export const canEditProduct = (status: ProductStatus) => status === 'draft' || status === 'rejected' || status === 'unpublished';
