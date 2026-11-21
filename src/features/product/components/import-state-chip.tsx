import { Check, Clock, TimerOff } from 'lucide-react';
import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import type { Messages } from '@/lib/i18n';
import { ImportState } from '@/features/product/types';

/** Where an import stands (Document 6, 8.7): waiting to be confirmed, expired or confirmed. */
const STATE_LOOK = {
  [ImportState.Waiting]: { tone: 'info', icon: Clock },
  [ImportState.Expired]: { tone: 'neutral', icon: TimerOff },
  [ImportState.Confirmed]: { tone: 'success', icon: Check },
} as const satisfies Record<ImportState, { tone: ChipTone; icon: typeof Clock }>;

export function ImportStateChip({ state, messages }: { state: ImportState; messages: Messages }) {
  const look = STATE_LOOK[state];
  return (
    <StatusChip tone={look.tone} icon={look.icon} label={messages.imports.history.state[state]} />
  );
}
