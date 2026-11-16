import { ClipboardCheck, Eye, House, Package, Store, Tags, type LucideIcon } from 'lucide-react';

/**
 * One entry of a staff area's menu, and its icon by name, so the server's menus and the browser's
 * drawer share one list. Kept apart from `menus.ts`, which reads `auth`'s rules and brings Zod, so
 * the browser menu never loads it.
 */
export const NAV_ICONS = {
  home: House,
  application: ClipboardCheck,
  profile: Store,
  products: Package,
  vendors: Store,
  catalogue: Tags,
  moderation: Eye,
} satisfies Record<string, LucideIcon>;
export type NavIcon = keyof typeof NAV_ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  /** Only this exact address counts as current (an area's home). */
  isExact?: boolean;
}

/** The current screen: an area's home only at its own address; any other entry also below it. */
export function isCurrentItem(item: NavItem, pathname: string): boolean {
  if (item.isExact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
