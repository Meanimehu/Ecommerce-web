import {
  ClipboardCheck,
  Eye,
  House,
  Layers,
  Package,
  ScrollText,
  Store,
  Tag,
  Tags,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react';

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
  stock: Layers,
  sales: Tag,
  users: Users,
  audit: ScrollText,
  vendors: Store,
  catalogue: Tags,
  moderation: Eye,
  coupons: Ticket,
} satisfies Record<string, LucideIcon>;
export type NavIcon = keyof typeof NAV_ICONS;

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
