import { z } from 'zod';

/** Every backend error: { error: { code, message, details?, requestId } } (api-contract.md, section 3). */
export const FieldErrorSchema = z.object({ field: z.string(), messages: z.array(z.string()) });

/**
 * `details` is an object for most errors (for example `retryAfterSeconds`) and a list of field errors for
 * VALIDATION_FAILED: [{ field, messages }] (api-contract.md, section 3).
 */
export const BackendErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string().optional(),
    details: z.union([z.array(FieldErrorSchema), z.record(z.string(), z.unknown())]).optional(),
    requestId: z.string().optional(),
  }),
});
