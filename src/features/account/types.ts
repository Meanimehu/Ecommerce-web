import { z } from 'zod';
import type { components } from '@/types/generated/backend-api';

/**
 * Backend Area 1, the person's own profile and saved addresses (Document 5, section 6.5), written
 * by hand from the API reference (D3-01). Source: Meanimehu/Ecommerce
 * docs/api/reference/area-1-accounts.md, sections 2 and 3. The profile itself is `auth`'s `User`.
 * The backend checks every field; the forms here only catch what is plainly missing.
 */

// ---- What the backend sends ----

/** A saved address (GET /me/addresses, each item). The phone comes back as +91…. */
export const AddressSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  name: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string(),
});
export type Address = z.infer<typeof AddressSchema>;
export const AddressListSchema = z.array(AddressSchema);

// ---- What the backend takes (generated, D7-02) ----

export type UpdateProfileBody = components['schemas']['UpdateMeDto'];
export type AddAddressBody = components['schemas']['CreateAddressDto'];
export type UpdateAddressBody = components['schemas']['UpdateAddressDto'];

// ---- The forms ----

/** At most 10 saved addresses (area-1-accounts.md, section 3). */
export const MAX_ADDRESSES = 10;

/** An email written like name@example.com; the backend checks it fully. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_PATTERN = /^\d{6}$/;

/** Name and email, both optional (D5-04). */
export const ProfileFormSchema = z.object({
  name: z.string().trim(),
  email: z
    .string()
    .trim()
    .refine((value) => value === '' || EMAIL_SHAPE.test(value), 'validation.emailShape'),
});
export type ProfileFormInput = z.input<typeof ProfileFormSchema>;
export type ProfileFormValues = z.output<typeof ProfileFormSchema>;

export const AddressFormSchema = z.object({
  label: z.string().trim(),
  name: z.string().trim().min(1, 'validation.required'),
  phone: z.string().trim().min(1, 'validation.required'),
  line1: z.string().trim().min(1, 'validation.required'),
  line2: z.string().trim(),
  city: z.string().trim().min(1, 'validation.required'),
  state: z.string().trim().min(1, 'validation.required'),
  pincode: z.string().trim().regex(PINCODE_PATTERN, 'validation.pincodeShape'),
});
export type AddressFormInput = z.input<typeof AddressFormSchema>;
export type AddressFormValues = z.output<typeof AddressFormSchema>;
