/**
 * The sales enums and small rules the screens share, with no Zod (Document 7, 20.2 and 20.3): a
 * screen that needs only these does not load the schemas in `types.ts`. The values are the
 * backend's words (area-5-sales-cart-coupons.md, part 1).
 */

/** A sale's status, judged by the backend at the moment of the call. */
export enum SaleStatus {
  Upcoming = 'upcoming',
  Active = 'active',
  Ended = 'ended',
  Cancelled = 'cancelled',
}

export const SALE_STATUSES: readonly SaleStatus[] = Object.values(SaleStatus);

export function isSaleStatus(value: string | null): value is SaleStatus {
  return value !== null && (SALE_STATUSES as readonly string[]).includes(value);
}

/** An upcoming or active sale can be cancelled; an ended one cannot, a cancelled one already is. */
export function canCancelSale(status: SaleStatus): boolean {
  return status === SaleStatus.Upcoming || status === SaleStatus.Active;
}

/** The longest reason the backend accepts when staff cancel a sale. */
export const STAFF_CANCEL_REASON_MAX_LENGTH = 500;

const ID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Whether a filter has the shape of a record id (the backend takes only full ids). */
export const isIdShape = (value: string) => ID_SHAPE.test(value);
