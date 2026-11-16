import type { Locale, Messages } from '@/lib/i18n';
import {
  adminCataloguePath,
  adminHomePath,
  adminVendorsPath,
  moderationQueuePath,
  myProductsPath,
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
  [AdminScreen.Vendors]: adminVendorsPath,
  [AdminScreen.Catalogue]: (lang) => adminCataloguePath(lang),
  [AdminScreen.Moderation]: moderationQueuePath,
};

const ADMIN_SCREEN_ICONS: Record<AdminScreen, NavIcon> = {
  [AdminScreen.Vendors]: 'vendors',
  [AdminScreen.Catalogue]: 'catalogue',
  [AdminScreen.Moderation]: 'moderation',
};

/**
 * The Vendor area menu, as in the approved screens (Document 8, Slice 4 notes): a person with no
 * vendor sees only the application; a person with a vendor sees Home, Business profile and
 * Products, and reaches the application from those pages, not from the menu.
 */
export function vendorNav(lang: Locale, messages: Messages, hasVendor: boolean): NavItem[] {
  if (!hasVendor) {
    return [{ href: vendorApplyPath(lang), label: messages.nav.application, icon: 'application' }];
  }
  return [
    { href: vendorHomePath(lang), label: messages.nav.vendorHome, icon: 'home', isExact: true },
    { href: vendorProfilePath(lang), label: messages.nav.profile, icon: 'profile' },
    { href: myProductsPath(lang), label: messages.nav.products, icon: 'products' },
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
    label: messages.nav.admin[screen],
    icon: ADMIN_SCREEN_ICONS[screen],
  }));
}

/** The Admin area menu: its home, then the screens the person's roles may use. */
export function adminNav(lang: Locale, messages: Messages, roles: readonly string[]): NavItem[] {
  return [
    { href: adminHomePath(lang), label: messages.nav.adminHome, icon: 'home', isExact: true },
    ...adminScreenLinks(lang, messages, roles),
  ];
}
