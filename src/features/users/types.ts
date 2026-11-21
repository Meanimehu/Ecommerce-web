import { z } from 'zod';
import { STAFF_ROLES } from '@/features/auth/types';
import { pageOf } from '@/types/common';

/**
 * Users and roles (backend Area 1, section 4; area-1-accounts.md): the admin's view of a person's
 * account. The roles and what each may do are fixed by the backend (Document 8, Slice 5 notes):
 * this feature only finds people, blocks and unblocks them, and gives or removes the staff roles
 * the backend allows an admin to give.
 */

export enum UserStatus {
  Active = 'active',
  Blocked = 'blocked',
}
export const USER_STATUSES: readonly UserStatus[] = Object.values(UserStatus);

/** Every role a user can hold, in the order the filter offers them. */
export const ALL_ROLES = ['customer', 'vendor_owner', ...STAFF_ROLES] as const;
export type AnyRole = (typeof ALL_ROLES)[number];

/** The roles an admin may give and remove (`customer` is automatic; `vendor_owner` comes from vendor approval). */
export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

export function isAnyRole(value: string): value is AnyRole {
  return (ALL_ROLES as readonly string[]).includes(value);
}

export function isUserStatus(value: string): value is UserStatus {
  return (USER_STATUSES as readonly string[]).includes(value);
}

/** The staff roles this person does not hold yet: what "Add role" offers. */
export function rolesToAdd(roles: readonly string[]): StaffRole[] {
  return STAFF_ROLES.filter((role) => !roles.includes(role));
}

/** The admin's view of a user (area-1-accounts.md, "Admin view of a user"). */
export const AdminUserSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  roles: z.array(z.string()),
  status: z.enum(UserStatus),
  blockedAt: z.string().nullable(),
  blockedBy: z.string().nullable(),
  blockReason: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

export const AdminUserPageSchema = pageOf(AdminUserSchema);

/** The two changes to a person's account that are not about roles. */
export enum UserAction {
  Block = 'block',
  Unblock = 'unblock',
}

export function isUserAction(value: string): value is UserAction {
  return (Object.values(UserAction) as string[]).includes(value);
}

/** The longest block reason the backend accepts. */
export const BLOCK_REASON_MAX_LENGTH = 500;

export interface BlockBody {
  reason: string;
}

export interface GrantRoleBody {
  role: StaffRole;
}

/** "Add role": one staff role, chosen from those the person does not hold; nothing is chosen at the start. */
export const AddRoleFormSchema = z.object({
  role: z.enum(STAFF_ROLES, { error: 'validation.choose' }),
});
export type AddRoleFormInput = z.input<typeof AddRoleFormSchema>;
export type AddRoleFormValues = z.output<typeof AddRoleFormSchema>;
