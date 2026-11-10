import { z } from 'zod';

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
