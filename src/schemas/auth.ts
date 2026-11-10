import { z } from 'zod';

/**
 * Area 1, login and sessions (backend docs/api/reference/area-1-accounts.md, section 1 and "GET /me").
 * Extra fields are ignored; missing or wrong required fields are a mismatch (Document 3, section 4).
 */
export const RoleSchema = z.string();

export const UserSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  roles: z.array(RoleSchema),
});
export type User = z.infer<typeof UserSchema>;

/** POST /auth/otp/request, 202 */
export const OtpRequestResultSchema = z.object({
  resendAfterSeconds: z.number().int().nonnegative(),
  expiresInSeconds: z.number().int().positive(),
});

/** POST /auth/otp/verify, 200 */
export const LoginResultSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  user: UserSchema,
  isNewUser: z.boolean(),
});

/** POST /auth/refresh, 200 */
export const RefreshResultSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

/** Staff roles (api-contract.md, section 2). */
export const STAFF_ROLES = ['admin', 'moderator', 'finance', 'support', 'marketing'] as const;
export const isStaff = (roles: readonly string[]): boolean => roles.some((r) => (STAFF_ROLES as readonly string[]).includes(r));
