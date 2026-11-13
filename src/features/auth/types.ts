import { z } from 'zod';

/**
 * Backend Area 1, Accounts: response shapes written by hand from area-1-accounts.md, because the
 * OpenAPI description has none (backend gap B4). Extra fields are ignored; a missing or wrong
 * required field is a mismatch (D3-02).
 */
export const RoleSchema = z.string();

/** "GET /me", also inside the login answer. */
export const UserSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  roles: z.array(RoleSchema),
});
export type User = z.infer<typeof UserSchema>;

/** "POST /auth/otp/request" (202). */
export const OtpRequestResultSchema = z.object({
  resendAfterSeconds: z.number().int().nonnegative(),
  expiresInSeconds: z.number().int().positive(),
});

/** "POST /auth/otp/verify" (200). */
export const LoginResultSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  user: UserSchema,
  isNewUser: z.boolean(),
});

/** "POST /auth/refresh" (200). */
export const RefreshResultSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

/** The role an approved vendor's owner has (api-contract.md, section 2). */
export const VENDOR_OWNER_ROLE = 'vendor_owner';

/** The staff role that reviews vendors and runs the admin lists (api-contract.md, section 2). */
export const ADMIN_ROLE = 'admin';

/** Staff roles: api-contract.md, section 2. */
export const STAFF_ROLES = ['admin', 'moderator', 'finance', 'support', 'marketing'] as const;

export function isStaff(roles: readonly string[]): boolean {
  const staffRoles: readonly string[] = STAFF_ROLES;
  return roles.some((role) => staffRoles.includes(role));
}

/** What our GET /api/session answers: the person, or null when nobody is logged in. */
export interface SessionAnswer {
  user: User | null;
}

// ---- Login form (Document 2, section 3) ----

/**
 * The form checks only a missing value or a wrong shape (D6-25); whether a number is a real mobile
 * or a code is right is the backend's to decide (PHONE_INVALID, OTP_INVALID). Messages are
 * catalogue keys (D-08). The usual ways of writing an Indian mobile are accepted, as the backend
 * reads them: 9876543210, 09876543210, 919876543210 and +919876543210, with spaces or dashes.
 */
const removeSpacesAndDashes = (value: string) => value.replace(/[\s-]/g, '');

const INDIAN_MOBILE = /^(?:\+91|91|0)?\d{10}$/;
const SIX_DIGIT_CODE = /^\d{6}$/;

export const PhoneFormSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'validation.phoneRequired')
    .refine((value) => INDIAN_MOBILE.test(removeSpacesAndDashes(value)), 'validation.phoneShape')
    .transform(removeSpacesAndDashes),
});
export type PhoneFormInput = z.input<typeof PhoneFormSchema>;
export type PhoneFormValues = z.output<typeof PhoneFormSchema>;

export const CodeFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'validation.codeRequired')
    .refine((value) => SIX_DIGIT_CODE.test(removeSpacesAndDashes(value)), 'validation.codeShape')
    .transform(removeSpacesAndDashes),
});
export type CodeFormInput = z.input<typeof CodeFormSchema>;
export type CodeFormValues = z.output<typeof CodeFormSchema>;
