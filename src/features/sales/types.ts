import { z } from 'zod';
import { pageOf } from '@/types/common';
import type { components } from '@/types/generated/backend-api';
import { rupeesAsPaise } from '@/features/product/types';

/**
 * Backend Area 5, part 1, sale prices: response shapes written by hand from the API reference
 * (D3-01), and the new-sale form. Source: Meanimehu/Ecommerce
 * docs/api/reference/area-5-sales-cart-coupons.md, "Part 1. Sale prices". A sale is a time-boxed
 * price below a variant's normal price; it cannot be edited, only cancelled and made again. Extra
 * fields are ignored; a missing or wrong required field is a mismatch (D3-02).
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

export const SaleSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  salePricePaise: z.number(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: z.enum(SaleStatus),
  cancelledAt: z.string().nullable(),
  cancelReason: z.string().nullable(),
});
export type Sale = z.infer<typeof SaleSchema>;

export const SalePageSchema = pageOf(SaleSchema);

/** A sale as staff read it: also its vendor (Area 5, GET /admin/sales). */
export const StaffSaleSchema = SaleSchema.extend({ vendorId: z.string() });
export type StaffSale = z.infer<typeof StaffSaleSchema>;
export const StaffSalePageSchema = pageOf(StaffSaleSchema);

/** The longest reason the backend accepts when staff cancel a sale. */
export const STAFF_CANCEL_REASON_MAX_LENGTH = 500;

const ID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Whether a filter has the shape of a record id (the backend takes only full ids). */
export const isIdShape = (value: string) => ID_SHAPE.test(value);

/** Request bodies, from the generated backend types (D7-02). The backend checks every field. */
export type CreateSaleBody = components['schemas']['CreateSaleDto'];
export type CancelSaleBody = components['schemas']['CancelSaleDto'];
export type StaffCancelSaleBody = components['schemas']['ReasonDto'];

// ---- The new-sale form (Document 5, section 8.2; approved Stage 5). Times are typed in IST. ----

/** What a date-and-time box gives: "2026-11-10T10:00", or nothing. */
const DATE_TIME_TEXT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const IST_OFFSET = '+05:30';

const dateTimeText = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .regex(DATE_TIME_TEXT, 'validation.required');

export const SaleFormSchema = z.object({
  variantId: z.string().min(1, 'validation.choose'),
  salePrice: rupeesAsPaise,
  startsAt: dateTimeText,
  endsAt: dateTimeText,
});
export type SaleFormInput = z.input<typeof SaleFormSchema>;
export type SaleFormValues = z.output<typeof SaleFormSchema>;

/** A time typed in IST ("2026-11-10T10:00") as the ISO 8601 time the backend takes. */
export function istToIso(value: string): string {
  return new Date(`${value}:00${IST_OFFSET}`).toISOString();
}

/** An ISO time as a date-and-time box's value in IST, for a box's starting value. */
export function isoToIst(iso: string): string {
  const ist = new Date(new Date(iso).getTime() + (5 * 60 + 30) * 60_000);
  return ist.toISOString().slice(0, 16);
}

/** The new sale's body: the price in paise, the times from IST. */
export function newSale(values: SaleFormValues): CreateSaleBody {
  return {
    variantId: values.variantId,
    salePricePaise: values.salePrice,
    startsAt: istToIso(values.startsAt),
    endsAt: istToIso(values.endsAt),
  };
}
