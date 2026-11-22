import type { NavIcon } from './nav-icons';

/**
 * One entry of a staff area's menu, with its icon by name, so the server's menus and the browser's
 * drawer share one list. Kept apart from `menus.ts`, which reads `auth`'s rules and brings Zod, so
 * the browser menu never loads it. The icons themselves are in `nav-icons.ts`, and each area's
 * browser menu loads only its own (`components/admin-nav.tsx`, `components/vendor-nav.tsx`).
 */
export type { NavIcon };

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  /** Only this exact address counts as current (an area's home). */
  isExact?: boolean;
  /** Other addresses that belong to this entry (Products also covers the CSV imports). */
  alsoUnder?: readonly string[];
}

/** The current screen: an area's home only at its own address; any other entry also below it. */
export function isCurrentItem(item: NavItem, pathname: string): boolean {
  if (item.isExact) return pathname === item.href;
  return [item.href, ...(item.alsoUnder ?? [])].some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}
