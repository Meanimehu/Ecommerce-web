import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import type { Messages } from '@/lib/i18n';
import { StockState } from '@/features/stock/types';

/**
 * A variant's stock state on staff screens (Document 6, section 9): in stock is success, low is
 * warning, out is error, always with words as well as colour. The words follow the backend's state,
 * never a number on the screen (Document 5, section 3).
 */
const STATE_TONES: Record<StockState, ChipTone> = {
  [StockState.InStock]: 'success',
  [StockState.Low]: 'warning',
  [StockState.Out]: 'error',
};

export function StockStateChip({ state, messages }: { state: StockState; messages: Messages }) {
  return <StatusChip tone={STATE_TONES[state]} label={messages.stock.states[state]} />;
}
