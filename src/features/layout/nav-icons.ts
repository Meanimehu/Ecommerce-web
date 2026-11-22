import {
  ClipboardCheck,
  ClipboardList,
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
 * Every staff menu icon by name, for the server (the menus, Admin home). The browser menus do not
 * load this map: each area's menu loads only its own icons, so a new entry in one area does not
 * make the other area's pages heavier (Document 6, section 14).
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
  couponRequests: ClipboardList,
} satisfies Record<string, LucideIcon>;
export type NavIcon = keyof typeof NAV_ICONS;

/** The icons one area's browser menu can draw. */
export type NavIconSet = Partial<Record<NavIcon, LucideIcon>>;
