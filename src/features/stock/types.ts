import { z } from 'zod';
import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { pageOf } from '@/types/common';
import type { components } from '@/types/generated/backend-api';

/**
 * Backend Area 4, inventory: response shapes written by hand from the API reference (D3-01), and
 * the stock forms. Source: Meanimehu/Ecommerce docs/api/reference/area-4-inventory.md, "How stock
 * works", "Shapes used below" and each endpoint. Extra fields are ignored; a missing or wrong
 * required field is a mismatch (D3-02). The enum values are the backend's own words.
 */

/** A variant's stock state, worked out by the backend from what is available and the threshold. */
export enum StockState {
  InStock = 'in_stock',
  Low = 'low',
  Out = 'out',
}

export const STOCK_STATES: readonly StockState[] = Object.values(StockState);

export function isStockState(value: string | null): value is StockState {
  return value !== null && (STOCK_STATES as readonly string[]).includes(value);
}

/** Why a stock history entry was written. */
export enum StockReason {
  Initial = 'initial',
  VendorSet = 'vendor_set',
  VendorAdjust = 'vendor_adjust',
  Reserve = 'reserve',
  Release = 'release',
  Expire = 'expire',
  Retake = 'retake',
  Restock = 'restock',
}

/** Why one row of a bulk update was refused (`error.details.failures[].code`). */
export enum BulkProblem {
  SkuUnknown = 'SKU_UNKNOWN',
  SkuRepeated = 'SKU_REPEATED',
  StockInvalid = 'STOCK_INVALID',
}

/** The backend's limits (area-4-inventory.md, "How stock works"). */
export const MAX_STOCK = 1_000_000;
export const BULK_MAX_ROWS = 500;
export const SKU_MAX_LENGTH = 64;
export const NOTE_MAX_LENGTH = 200;
/** The threshold used when the vendor has not set one (`LOW_STOCK_THRESHOLD`). */
export const DEFAULT_THRESHOLD = 5;

/** Stock row: the list, a change, the threshold and the bulk answer. */
export const StockRowSchema = z.object({
  variantId: z.string(),
  productId: z.string(),
  productTitle: z.string(),
  productStatus: z.string(),
  sku: z.string(),
  sizeCode: z.string().nullable(),
  colourCode: z.string().nullable(),
  variantStatus: z.string(),
  available: z.number(),
  lowStockThreshold: z.number().nullable(),
  effectiveThreshold: z.number(),
  state: z.enum(StockState),
  updatedAt: z.string(),
});
export type StockRow = z.infer<typeof StockRowSchema>;

export const StockPageSchema = pageOf(StockRowSchema);

/** The summary over active variants (GET /vendors/me/inventory/summary). */
export const StockSummarySchema = z.object({
  variants: z.number(),
  inStock: z.number(),
  low: z.number(),
  out: z.number(),
  totalUnits: z.number(),
  defaultThreshold: z.number(),
});
export type StockSummary = z.infer<typeof StockSummarySchema>;

/** One history entry, newest first. `reason` is kept as text so a new reason still shows. */
export const StockHistoryEntrySchema = z.object({
  id: z.string(),
  delta: z.number(),
  balanceAfter: z.number(),
  reason: z.string(),
  note: z.string().nullable(),
  createdAt: z.string(),
});
export type StockHistoryEntry = z.infer<typeof StockHistoryEntrySchema>;

export const StockHistoryPageSchema = pageOf(StockHistoryEntrySchema);

/** A bulk update that went through: how many variants changed, and every row after it. */
export const BulkStockResultSchema = z.object({
  changed: z.number(),
  items: z.array(StockRowSchema),
});
export type BulkStockResult = z.infer<typeof BulkStockResultSchema>;

/** One refused row of a bulk update; `index` is its place in the list that was sent. */
export const BulkFailureSchema = z.object({
  index: z.number(),
  sku: z.string(),
  code: z.string(),
});
export type BulkFailure = z.infer<typeof BulkFailureSchema>;

const BulkFailuresSchema = z.object({ failures: z.array(BulkFailureSchema) });

/** The refused rows in a STOCK_BULK_INVALID answer, or none when the details are not as expected. */
export function bulkFailuresOf(details: Record<string, unknown> | undefined): BulkFailure[] {
  const parsed = BulkFailuresSchema.safeParse(details);
  return parsed.success ? parsed.data.failures : [];
}

/** Request bodies, from the generated backend types (D7-02). The backend checks every field. */
export type SetStockBody = components['schemas']['SetStockDto'];
export type AdjustStockBody = components['schemas']['AdjustStockDto'];
export type SetThresholdBody = components['schemas']['SetThresholdDto'];
export type BulkStockBody = components['schemas']['BulkStockDto'];

// ---- The stock forms (Document 5, section 7.4). Only a missing value or a wrong shape is checked
// here; the limits are the backend's. ----

/** How the vendor changes one variant: an exact number, or units added or removed. */
export enum StockChangeMode {
  Set = 'set',
  Add = 'add',
  Remove = 'remove',
}

export const STOCK_CHANGE_MODES: readonly StockChangeMode[] = Object.values(StockChangeMode);

const WHOLE_NUMBER = /^\d+$/;

const wholeNumberText = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .regex(WHOLE_NUMBER, 'validation.wholeNumber');

export const StockChangeFormSchema = z.object({
  mode: z.enum(StockChangeMode),
  amount: wholeNumberText,
  note: z.string().trim().max(NOTE_MAX_LENGTH),
});
export type StockChangeFormInput = z.input<typeof StockChangeFormSchema>;
export type StockChangeFormValues = z.output<typeof StockChangeFormSchema>;

/** An empty threshold goes back to the default. */
export const ThresholdFormSchema = z.object({
  threshold: z.string().trim().regex(/^\d*$/, 'validation.wholeNumber'),
});
export type ThresholdFormInput = z.input<typeof ThresholdFormSchema>;
export type ThresholdFormValues = z.output<typeof ThresholdFormSchema>;

/** One row of the bulk table as typed; a row with neither value is left out. */
export const BulkRowSchema = z.object({ sku: z.string(), quantity: z.string() });
export type BulkRow = z.infer<typeof BulkRowSchema>;

export const BulkStockFormSchema = z.object({ rows: z.array(BulkRowSchema) });
export type BulkStockFormValues = z.infer<typeof BulkStockFormSchema>;

/** A size or colour's code and its name, from the product form guide. */
export type CodeLabel = { code: string; label: string };

/**
 * A variant's name as the stock screens show it: "Block-print kurta · M · Indigo". Sizes and
 * colours are named from the form guide; a code it does not list is shown as it is.
 */
export function variantName(
  row: Pick<StockRow, 'productTitle' | 'sizeCode' | 'colourCode'>,
  sizes: readonly CodeLabel[] = [],
  colours: readonly CodeLabel[] = [],
): string {
  const labelOf = (entries: readonly CodeLabel[], code: string | null) =>
    code ? (entries.find((entry) => entry.code === code)?.label ?? code) : null;
  return [row.productTitle, labelOf(sizes, row.sizeCode), labelOf(colours, row.colourCode)]
    .filter(Boolean)
    .join(' · ');
}

const REASON_KEYS: Partial<Record<string, keyof Messages['stock']['reasons']>> = {
  [StockReason.Initial]: 'initial',
  [StockReason.Reserve]: 'reserve',
  [StockReason.Release]: 'release',
  [StockReason.Expire]: 'expire',
  [StockReason.Retake]: 'retake',
  [StockReason.Restock]: 'restock',
};

/**
 * What one entry changed, in words: "Set to 12", "Added 5", "Removed 3", or why the backend moved
 * stock and by how much ("Held for an order −2"). A reason this screen does not know is shown with
 * the backend's own word.
 */
export function changeText(entry: StockHistoryEntry, messages: Messages): string {
  const reasons = messages.stock.reasons;
  if (entry.reason === StockReason.VendorSet) {
    return fill(reasons.vendor_set, { count: entry.balanceAfter });
  }
  if (entry.reason === StockReason.VendorAdjust) {
    return fill(entry.delta < 0 ? reasons.removed : reasons.added, {
      count: Math.abs(entry.delta),
    });
  }
  const key = REASON_KEYS[entry.reason];
  return `${key ? reasons[key] : entry.reason} ${signed(entry.delta)}`;
}

/** A change with its sign: +5, −2 (a true minus sign), 0. */
export function signed(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return '0';
}
