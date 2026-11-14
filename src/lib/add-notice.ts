import type { ErrorCode } from '@/lib/error-codes';

/**
 * What happened to an "Add to cart" made before logging in (D2-02), handed from the login answer to
 * the page the person returns to. Shared code (Document 7, 20.4): `auth` keeps it when the login
 * answer arrives, the product page takes it, and the login endpoint writes it with `cart`'s help,
 * so neither feature imports the other.
 *
 * Kept free of Zod on purpose: the login form and the product page read it, and
 * `features/cart/types.ts` brings Zod with it (about 31 KB).
 */

/** The values are stored in the browser. */
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

/** Where the notice waits in the browser, for this tab only, until the next page takes it. */
const NOTICE_KEY = 'dhaaga:pending-add';

/** In the browser, when the login answer arrives. */
export function keepAddNotice(notice: AddNotice): void {
  try {
    sessionStorage.setItem(NOTICE_KEY, JSON.stringify(notice));
  } catch {
    // Storage may be unavailable: the cart still shows what is there.
  }
}

/** In the browser, on the page the person returns to: shown once, then gone. */
export function takeAddNotice(): AddNotice | null {
  try {
    const stored = sessionStorage.getItem(NOTICE_KEY);
    sessionStorage.removeItem(NOTICE_KEY);
    const storedNotice: unknown = stored ? JSON.parse(stored) : null;
    return isAddNotice(storedNotice) ? storedNotice : null;
  } catch {
    return null;
  }
}
