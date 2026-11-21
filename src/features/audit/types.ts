import { z } from 'zod';
import { pageOf } from '@/types/common';

/**
 * The audit log (backend Area 1, section 5; area-1-accounts.md): who did what, newest first. Read
 * only: nothing can be changed or deleted. The list of action names grows with each backend area,
 * so an action is shown by its own name; the kinds of record are fixed and shown in words.
 */

/** One row (area-1-accounts.md, "Audit row"). */
export const AuditRowSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  actorId: z.string().nullable(),
  actorRole: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  reason: z.string().nullable(),
  requestId: z.string().nullable(),
});
export type AuditRow = z.infer<typeof AuditRowSchema>;

export const AuditPageSchema = pageOf(AuditRowSchema);

/** The kinds of record a row can be about (backend `audit.constants.ts`, AuditEntityType). */
export const AUDIT_ENTITY_TYPES = [
  'user',
  'vendor',
  'vendor_document',
  'category',
  'brand',
  'size',
  'colour',
  'gst_rate',
  'hsn_code',
  'product',
  'product_variant',
  'product_media',
  'product_import',
  'stock_level',
  'variant_sale_price',
  'coupon',
  'coupon_request',
] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export function isAuditEntityType(value: string): value is AuditEntityType {
  return (AUDIT_ENTITY_TYPES as readonly string[]).includes(value);
}

/** The longest action name and record kind the backend accepts in a filter. */
export const ACTION_MAX_LENGTH = 100;

const ID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/** Whether this text has the shape of a record id (the backend takes only full ids here). */
export const isIdShape = (value: string) => ID_SHAPE.test(value);

/** Whether this text is a date as a date box gives it ("2026-11-21"). */
export const isDayShape = (value: string) =>
  DAY_SHAPE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00+05:30`));

/** The start of a day in IST as an ISO time: rows at or after it. */
export function istDayStart(day: string): string {
  return new Date(`${day}T00:00:00+05:30`).toISOString();
}

/** The start of the next day in IST as an ISO time: rows before it, so the whole day is included. */
export function istDayEnd(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00+05:30`) + 24 * 3_600_000).toISOString();
}

/** The filters as the address holds them. */
export interface AuditFilters {
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  from: string;
  to: string;
}

/** Which filters cannot be sent because of their shape; nothing is sent while any is wrong. */
export function badFilters(filters: AuditFilters): (keyof AuditFilters)[] {
  const bad: (keyof AuditFilters)[] = [];
  if (filters.entityId && !isIdShape(filters.entityId)) bad.push('entityId');
  if (filters.actorId && !isIdShape(filters.actorId)) bad.push('actorId');
  if (filters.from && !isDayShape(filters.from)) bad.push('from');
  if (filters.to && !isDayShape(filters.to)) bad.push('to');
  return bad;
}

/** The backend's query for these filters: days in IST become ISO times; an unknown kind is left out. */
export function auditQuery(filters: AuditFilters): Record<string, string | undefined> {
  return {
    action: filters.action.trim() || undefined,
    entityType: isAuditEntityType(filters.entityType) ? filters.entityType : undefined,
    entityId: filters.entityId || undefined,
    actorId: filters.actorId || undefined,
    from: filters.from ? istDayStart(filters.from) : undefined,
    to: filters.to ? istDayEnd(filters.to) : undefined,
  };
}

/** The values a row's "before" and "after" hold, as one list of changed names. */
export function changedNames(row: AuditRow): string[] {
  return [...new Set([...Object.keys(row.before ?? {}), ...Object.keys(row.after ?? {})])];
}
