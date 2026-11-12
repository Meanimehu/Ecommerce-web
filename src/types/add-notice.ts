import type { ErrorCode } from '@/lib/error-codes';

/*
 * Kept apart from types/cart.ts on purpose: the storefront header reads this on every page, and
 * types/cart.ts brings Zod with it (about 32 KB). Nothing here may import Zod.
 */

/** What happened to an "Add to cart" made before logging in (D2-02). The values are stored in the browser. */
export enum AddOutcome {
  Added = 'added',
  Failed = 'failed',
  Unknown = 'unknown',
}

/** The login answer's word on a pending add, kept for the page the person returns to. */
export interface AddNotice {
  outcome: AddOutcome;
  code?: ErrorCode;
}

const ADD_OUTCOMES: readonly string[] = Object.values(AddOutcome);

export function isAddNotice(value: unknown): value is AddNotice {
  if (value === null || typeof value !== 'object') return false;
  const outcome = (value as { outcome?: unknown }).outcome;
  return typeof outcome === 'string' && ADD_OUTCOMES.includes(outcome);
}
