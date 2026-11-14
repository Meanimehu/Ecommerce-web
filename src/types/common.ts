import { z } from 'zod';

/** Shapes shared by every backend area (backend docs/api/api-contract.md). */

/** A page of a list (api-contract.md, paging): {items, page, limit, total}. */
export const pageOf = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), page: z.number(), limit: z.number(), total: z.number() });
export type Page<T> = { items: T[]; page: number; limit: number; total: number };

/** A reason someone else will read (a rejection, a suspension). The backend requires one and sets its length. */
export const ReasonSchema = z.object({
  reason: z.string().trim().min(1, 'validation.reasonRequired'),
});
export type ReasonInput = z.input<typeof ReasonSchema>;
