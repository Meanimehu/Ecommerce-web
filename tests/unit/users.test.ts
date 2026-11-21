import { describe, expect, it } from 'vitest';
import { getMessages } from '@/lib/messages';
import { roleNames } from '@/features/users/components/role-names';
import {
  AddRoleFormSchema,
  AdminUserSchema,
  isAnyRole,
  isStaffRole,
  isUserAction,
  rolesToAdd,
} from '@/features/users/types';

/** Users and roles (area-1-accounts.md, section 4; Document 8, Slice 5 notes). */
describe('users and roles', () => {
  it('offers only the staff roles a person does not hold, in the backend order', () => {
    expect(rolesToAdd(['customer'])).toEqual([
      'admin',
      'moderator',
      'finance',
      'support',
      'marketing',
    ]);
    expect(rolesToAdd(['customer', 'moderator', 'admin'])).toEqual([
      'finance',
      'support',
      'marketing',
    ]);
    expect(
      rolesToAdd(['customer', 'admin', 'moderator', 'finance', 'support', 'marketing']),
    ).toEqual([]);
  });

  it('tells staff roles, which an admin gives, from customer and vendor owner, which it does not', () => {
    expect(isStaffRole('support')).toBe(true);
    expect(isStaffRole('customer')).toBe(false);
    expect(isStaffRole('vendor_owner')).toBe(false);
    expect(isAnyRole('vendor_owner')).toBe(true);
    expect(isAnyRole('boss')).toBe(false);
  });

  it('knows the two account changes', () => {
    expect(isUserAction('block')).toBe(true);
    expect(isUserAction('unblock')).toBe(true);
    expect(isUserAction('delete')).toBe(false);
  });

  it('names roles in words, keeping a role it does not know yet', () => {
    expect(roleNames(['customer', 'vendor_owner', 'support'], getMessages('en'))).toBe(
      'Customer, Vendor owner, Support',
    );
    expect(roleNames(['customer', 'auditor'], getMessages('hi'))).toBe('ग्राहक, auditor');
  });

  it('accepts only a staff role in "Add role"', () => {
    expect(AddRoleFormSchema.safeParse({ role: 'marketing' }).success).toBe(true);
    expect(AddRoleFormSchema.safeParse({ role: 'customer' }).success).toBe(false);
  });

  it('reads the admin view of a user', () => {
    const user = AdminUserSchema.parse({
      id: 'u1',
      phone: '+919444444444',
      name: null,
      email: null,
      roles: ['customer'],
      status: 'blocked',
      blockedAt: '2026-11-03T11:20:53.803Z',
      blockedBy: 'a1',
      blockReason: 'Repeated fake orders',
      lastLoginAt: null,
      createdAt: '2026-11-03T11:20:37.509Z',
    });
    expect(user.status).toBe('blocked');
  });
});
