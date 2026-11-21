import { describe, expect, it } from 'vitest';
import { getMessages } from '@/lib/messages';
import {
  AdminScreen,
  adminScreensFor,
  canCancelSales,
  canReadStockHistory,
  canUseAdminScreen,
} from '@/features/auth/staff-screens';
import { adminNav } from '@/features/layout/menus';

/**
 * Which admin screens and actions each staff role may use (Document 5, section 8.3; Document 8,
 * Slice 5 notes). The backend still checks every call; this keeps the menu, the Admin home and the
 * pages from offering a screen or a button the backend would refuse.
 */
describe('the admin screens of each staff role', () => {
  it('gives an admin every screen, in menu order', () => {
    expect(adminScreensFor(['customer', 'admin'])).toEqual([
      AdminScreen.Users,
      AdminScreen.AuditLog,
      AdminScreen.Vendors,
      AdminScreen.Catalogue,
      AdminScreen.Moderation,
      AdminScreen.Sales,
    ]);
  });

  it('gives a moderator product moderation and sales', () => {
    expect(adminScreensFor(['moderator'])).toEqual([AdminScreen.Moderation, AdminScreen.Sales]);
    expect(canUseAdminScreen(['moderator'], AdminScreen.Vendors)).toBe(false);
    expect(canUseAdminScreen(['moderator'], AdminScreen.Catalogue)).toBe(false);
    expect(canUseAdminScreen(['moderator'], AdminScreen.Users)).toBe(false);
    expect(canUseAdminScreen(['moderator'], AdminScreen.AuditLog)).toBe(false);
  });

  it('gives support, marketing and finance only sales (coupons are on hold)', () => {
    for (const role of ['support', 'marketing', 'finance']) {
      expect(adminScreensFor(['customer', role])).toEqual([AdminScreen.Sales]);
    }
  });

  it('lets only admins and moderators cancel a sale', () => {
    expect(canCancelSales(['admin'])).toBe(true);
    expect(canCancelSales(['moderator'])).toBe(true);
    for (const role of ['support', 'marketing', 'finance', 'customer']) {
      expect(canCancelSales([role])).toBe(false);
    }
  });

  it('lets admins, moderators and support read any variant’s stock history', () => {
    for (const role of ['admin', 'moderator', 'support']) {
      expect(canReadStockHistory([role])).toBe(true);
    }
    for (const role of ['marketing', 'finance', 'customer', 'vendor_owner']) {
      expect(canReadStockHistory([role])).toBe(false);
    }
  });

  it('gives a person with several roles everything any of them allows', () => {
    expect(adminScreensFor(['moderator', 'support'])).toEqual([
      AdminScreen.Moderation,
      AdminScreen.Sales,
    ]);
    expect(canUseAdminScreen(['support', 'admin'], AdminScreen.Vendors)).toBe(true);
    expect(canCancelSales(['marketing', 'moderator'])).toBe(true);
  });

  it('gives a customer or a vendor owner no admin screen', () => {
    expect(adminScreensFor(['customer', 'vendor_owner'])).toEqual([]);
  });

  it('builds the Admin menu from the same rule: Home, then the allowed screens', () => {
    const messages = getMessages('en');
    expect(adminNav('en', messages, ['moderator']).map((item) => item.label)).toEqual([
      'Home',
      'Product moderation',
      'Sales',
    ]);
    expect(adminNav('en', messages, ['finance']).map((item) => item.label)).toEqual([
      'Home',
      'Sales',
    ]);
    expect(adminNav('en', messages, ['admin']).map((item) => item.label)).toEqual([
      'Home',
      'Users and roles',
      'Audit log',
      'Vendor review',
      'Catalogue lists',
      'Product moderation',
      'Sales',
    ]);
  });
});
