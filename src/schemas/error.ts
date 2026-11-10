import { z } from 'zod';

/** Every backend error: { error: { code, message, details?, requestId } } (api-contract.md, section 3). */
export const BackendErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string().optional(),
  }),
});
