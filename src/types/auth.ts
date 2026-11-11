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

/** What our GET /api/session answers: the person, or null when nobody is logged in. */
export interface SessionAnswer {
  user: User | null;
}

// ---- Login form (Document 2, section 3) ----

/**
 * Login form checks: only what is cheap and certain, a missing value or a wrong shape (Document 5, section 10;
 * D6-25). Which numbers are valid mobiles, and whether a code is right, is the backend's to decide (PHONE_INVALID,
 * OTP_INVALID). Messages are catalogue keys (D-08).
 *
 * The common ways of writing an Indian mobile are accepted (Document 2, section 3), the same shapes the backend reads:
 * 9876543210, 09876543210, 919876543210, +919876543210, with spaces or dashes.
 */
const digits = (value: string) => value.replace(/[\s-]/g, '');

export const PhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'validation.phoneRequired')
    .refine((value) => /^(?:\+91|91|0)?\d{10}$/.test(digits(value)), 'validation.phoneShape')
    .transform(digits),
});
export type PhoneInput = z.input<typeof PhoneSchema>;

export const CodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'validation.codeRequired')
    .refine((value) => /^\d{6}$/.test(digits(value)), 'validation.codeShape')
    .transform(digits),
});
export type CodeInput = z.input<typeof CodeSchema>;
