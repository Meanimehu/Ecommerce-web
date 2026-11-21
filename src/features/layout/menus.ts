import type { Locale, Messages } from '@/lib/i18n';
import {
  adminAuditLogPath,
  adminCataloguePath,
  adminCouponsPath,
  adminHomePath,
  adminSalesPath,
  adminUsersPath,
  adminVendorsPath,
  moderationQueuePath,
  myCouponsPath,
  myImportsPath,
  myProductsPath,
  mySalesPath,
  myStockPath,
  vendorApplyPath,
  vendorHomePath,
  vendorProfilePath,
} from '@/lib/routes';
import { AdminScreen, adminScreensFor } from '@/features/auth/staff-screens';
import type { NavIcon, NavItem } from '@/features/layout/nav-items';

/**
 * What the staff area menus list: only the screens this person can use (Document 5, sections 5
 * and 8). Built on the server; the rules come from `auth` (who may use which admin screen) and
 * `vendor` (no vendor: only the application). Slices 4 and 5 add the rest.
 */

/** The two staff areas. */
export enum StaffArea {
  Vendor = 'vendor',
  Admin = 'admin',
}

const ADMIN_SCREEN_PATHS: Record<AdminScreen, (lang: Locale) => string> = {
  [AdminScreen.Users]: adminUsersPath,
  [AdminScreen.AuditLog]: (lang) => adminAuditLogPath(lang),
  [AdminScreen.Vendors]: adminVendorsPath,
  [AdminScreen.Catalogue]: (lang) => adminCataloguePath(lang),
  [AdminScreen.Moderation]: moderationQueuePath,
  [AdminScreen.Sales]: adminSalesPath,
  [AdminScreen.Coupons]: (lang) => adminCouponsPath(lang),
};

const ADMIN_SCREEN_ICONS: Record<AdminScreen, NavIcon> = {
  [AdminScreen.Users]: 'users',
  [AdminScreen.AuditLog]: 'audit',
  [AdminScreen.Vendors]: 'vendors',
  [AdminScreen.Catalogue]: 'catalogue',
  [AdminScreen.Moderation]: 'moderation',
  [AdminScreen.Sales]: 'sales',
  [AdminScreen.Coupons]: 'coupons',
};

/**
 * The Vendor area menu, as in the approved screens (Document 8, Slice 4 notes and held items): a
 * person with no vendor sees only the application; a person with a vendor sees Home, Business
 * profile, Products, Stock, Sales and Coupons, and reaches the application from those pages, not
 * from the menu. The newer labels come from the Vendor area's own text, which only its pages carry
 * to the browser, not from `nav`, which every page carries (Document 6, section 14).
 */
export function vendorNav(lang: Locale, messages: Messages, hasVendor: boolean): NavItem[] {
  if (!hasVendor) {
    return [{ href: vendorApplyPath(lang), label: messages.nav.application, icon: 'application' }];
  }
  return [
    { href: vendorHomePath(lang), label: messages.nav.vendorHome, icon: 'home', isExact: true },
    { href: vendorProfilePath(lang), label: messages.vendor.profile.title, icon: 'profile' },
    {
      href: myProductsPath(lang),
      label: messages.nav.products,
      icon: 'products',
      alsoUnder: [myImportsPath(lang)],
    },
    { href: myStockPath(lang), label: messages.stock.title, icon: 'stock' },
    { href: mySalesPath(lang), label: messages.sales.title, icon: 'sales' },
    { href: myCouponsPath(lang), label: messages.coupon.vendor.title, icon: 'coupons' },
  ];
}

/** The admin screens these roles may use, as links: the Admin menu and the Admin home. */
export function adminScreenLinks(
  lang: Locale,
  messages: Messages,
  roles: readonly string[],
): NavItem[] {
  return adminScreensFor(roles).map((screen) => ({
    href: ADMIN_SCREEN_PATHS[screen](lang),
    label: adminScreenLabel(screen, messages),
    icon: ADMIN_SCREEN_ICONS[screen],
  }));
}

/**
 * A screen's name in the menu. The Slice 2 screens have theirs in `nav`; the newer ones take it from
 * their own area text, which only staff pages carry to the browser (Document 6, section 14).
 */
function adminScreenLabel(screen: AdminScreen, messages: Messages): string {
  switch (screen) {
    case AdminScreen.Users:
      return messages.users.title;
    case AdminScreen.AuditLog:
      return messages.audit.title;
    case AdminScreen.Sales:
      return messages.sales.title;
    case AdminScreen.Coupons:
      return messages.coupon.staff.title;
    case AdminScreen.Vendors:
    case AdminScreen.Catalogue:
    case AdminScreen.Moderation:
      return messages.nav.admin[screen];
  }
}

/** The Admin area menu: its home, then the screens the person's roles may use. */
export function adminNav(lang: Locale, messages: Messages, roles: readonly string[]): NavItem[] {
  return [
    { href: adminHomePath(lang), label: messages.nav.adminHome, icon: 'home', isExact: true },
    ...adminScreenLinks(lang, messages, roles),
  ];
}
