import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import type { Messages } from '@/lib/i18n';
import { UserStatus } from '@/features/users/types';

/** A person's account status: words as well as colour (Document 6, section 9). */
const STATUS_TONES: Record<UserStatus, ChipTone> = {
  [UserStatus.Active]: 'success',
  [UserStatus.Blocked]: 'error',
};

export function UserStatusChip({ status, messages }: { status: UserStatus; messages: Messages }) {
  return <StatusChip tone={STATUS_TONES[status]} label={messages.users.statuses[status]} />;
}
