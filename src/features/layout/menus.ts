import type { Locale, Messages } from '@/lib/i18n';
import type { NavItem } from '@/features/layout/components/area-nav';

/**
 * What the side menus list: only the screens this person can use (Document 5, sections 5 and 8). Slice 2 adds the
 * screens as they are built; the rest arrive in Slices 4 and 5.
 */
export function vendorNav(lang: Locale, t: Messages, hasVendor: boolean): NavItem[] {
  const base = `/${lang}/vendor`;
  return [
    ...(hasVendor ? [{ href: base, label: t.nav.vendorHome, icon: 'home' as const, exact: true }] : []),
    ...(hasVendor ? [{ href: `${base}/products`, label: t.nav.products, icon: 'products' as const }] : []),
    { href: `${base}/apply`, label: t.nav.application, icon: 'application' },
  ];
}

/** Admin screens and the roles that can read them (Document 5, section 8.3). */
export const ADMIN_SCREENS = [
  { key: 'vendors', path: 'vendors', roles: ['admin'], icon: 'vendors' },
  { key: 'catalogue', path: 'catalogue', roles: ['admin'], icon: 'catalogue' },
  { key: 'moderation', path: 'moderation', roles: ['moderator', 'admin'], icon: 'moderation' },
] as const;

export function adminScreens(roles: readonly string[]) {
  return ADMIN_SCREENS.filter((screen) => screen.roles.some((role) => roles.includes(role)));
}

export function adminNav(lang: Locale, t: Messages, roles: readonly string[]): NavItem[] {
  const base = `/${lang}/admin`;
  return [
    { href: base, label: t.nav.adminHome, icon: 'home', exact: true },
    ...adminScreens(roles).map((screen) => ({ href: `${base}/${screen.path}`, label: t.nav.admin[screen.key], icon: screen.icon })),
  ];
}
