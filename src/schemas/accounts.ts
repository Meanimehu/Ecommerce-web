import { z } from 'zod';

/**
 * Backend Area 1, Accounts: response shapes, written by hand from the API reference (D3-01), because the OpenAPI
 * description has none (backend gap B4). Source: Meanimehu/Ecommerce docs/api/reference/area-1-accounts.md.
 * TypeScript types are inferred from these schemas, never written a second time (Document 3, section 4).
 * Extra fields are ignored; missing or wrong required fields are a mismatch (D3-02).
 */
export const RoleSchema = z.string();

/** The User object: section 2, "GET /me" (also inside the login answer, section 1). */
export const UserSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  roles: z.array(RoleSchema),
});
export type User = z.infer<typeof UserSchema>;

/** Section 1, "POST /auth/otp/request": 202. */
export const OtpRequestResultSchema = z.object({
  resendAfterSeconds: z.number().int().nonnegative(),
  expiresInSeconds: z.number().int().positive(),
});

/** Section 1, "POST /auth/otp/verify": 200. */
export const LoginResultSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  user: UserSchema,
  isNewUser: z.boolean(),
});

/** Section 1, "POST /auth/refresh": 200. */
export const RefreshResultSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

/** Staff roles: api-contract.md, section 2. */
export const STAFF_ROLES = ['admin', 'moderator', 'finance', 'support', 'marketing'] as const;
export const isStaff = (roles: readonly string[]): boolean => roles.some((r) => (STAFF_ROLES as readonly string[]).includes(r));
