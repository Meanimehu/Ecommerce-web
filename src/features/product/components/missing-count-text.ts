import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';

/** "Ready", "1 thing missing" or "3 things missing": how much a product still needs. */
export function missingCountText(count: number, productMessages: Messages['product']): string {
  if (count === 0) return productMessages.ready;
  if (count === 1) return productMessages.missingOne;
  return fill(productMessages.missingMany, { count });
}
