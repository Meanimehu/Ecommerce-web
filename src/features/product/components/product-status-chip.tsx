import { Check, Clock, EyeOff, List, X } from 'lucide-react';
import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import type { Messages } from '@/lib/i18n';
import { ProductStatus } from '@/features/product/types';

/**
 * The product status chip (Document 6, 8.7): Draft, In review, Approved, Rejected, Unpublished,
 * each with its icon.
 */
const STATUS_LOOK = {
  [ProductStatus.Draft]: { tone: 'neutral', icon: List },
  [ProductStatus.Submitted]: { tone: 'info', icon: Clock },
  [ProductStatus.Approved]: { tone: 'success', icon: Check },
  [ProductStatus.Rejected]: { tone: 'error', icon: X },
  [ProductStatus.Unpublished]: { tone: 'neutral', icon: EyeOff },
} as const satisfies Record<ProductStatus, { tone: ChipTone; icon: typeof List }>;

export function ProductStatusChip({
  status,
  messages,
}: {
  status: ProductStatus;
  messages: Messages;
}) {
  const look = STATUS_LOOK[status];
  return <StatusChip tone={look.tone} icon={look.icon} label={messages.product.status[status]} />;
}
