import { describe, expect, it } from 'vitest';
import { getMessages } from '@/lib/messages';
import { AdminScreen, adminScreensFor, canUseAdminScreen } from '@/features/auth/staff-screens';
import { adminNav } from '@/features/layout/menus';

/**
 * Which admin screens each staff role may use (Document 5, section 8.3; Document 8, Slice 5
 * notes). The backend still checks every call; this keeps the menu, the Admin home and the pages
 * from offering a screen the backend would refuse.
 */
describe('the admin screens of each staff role', () => {
  it('gives an admin every screen built so far, in menu order', () => {
    expect(adminScreensFor(['customer', 'admin'])).toEqual([
      AdminScreen.Users,
      AdminScreen.AuditLog,
      AdminScreen.Vendors,
      AdminScreen.Catalogue,
      AdminScreen.Moderation,
    ]);
  });

  it('gives a moderator only product moderation', () => {
    expect(adminScreensFor(['moderator'])).toEqual([AdminScreen.Moderation]);
    expect(canUseAdminScreen(['moderator'], AdminScreen.Vendors)).toBe(false);
    expect(canUseAdminScreen(['moderator'], AdminScreen.Catalogue)).toBe(false);
    expect(canUseAdminScreen(['moderator'], AdminScreen.Users)).toBe(false);
    expect(canUseAdminScreen(['moderator'], AdminScreen.AuditLog)).toBe(false);
  });

  it('gives support, marketing and finance none of the screens built so far', () => {
    for (const role of ['support', 'marketing', 'finance']) {
      expect(adminScreensFor(['customer', role])).toEqual([]);
    }
  });

  it('gives a person with several roles everything any of them allows', () => {
    expect(adminScreensFor(['moderator', 'support'])).toEqual([AdminScreen.Moderation]);
    expect(canUseAdminScreen(['support', 'admin'], AdminScreen.Vendors)).toBe(true);
  });

  it('gives a customer or a vendor owner no admin screen', () => {
    expect(adminScreensFor(['customer', 'vendor_owner'])).toEqual([]);
  });

  it('builds the Admin menu from the same rule: Home, then the allowed screens', () => {
    const messages = getMessages('en');
    expect(adminNav('en', messages, ['moderator']).map((item) => item.label)).toEqual([
      'Home',
      'Product moderation',
    ]);
    expect(adminNav('en', messages, ['finance']).map((item) => item.label)).toEqual(['Home']);
    expect(adminNav('en', messages, ['admin']).map((item) => item.label)).toEqual([
      'Home',
      'Users and roles',
      'Audit log',
      'Vendor review',
      'Catalogue lists',
      'Product moderation',
    ]);
  });
});
