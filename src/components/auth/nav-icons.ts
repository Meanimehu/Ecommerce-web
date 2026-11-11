import { ClipboardCheck, Eye, House, Package, Store, Tags, type LucideIcon } from 'lucide-react';

/** The icon of each menu entry, by name, so server pages and the browser menu share one list. */
export const NAV_ICONS = { home: House, application: ClipboardCheck, products: Package, vendors: Store, catalogue: Tags, moderation: Eye } satisfies Record<string, LucideIcon>;
export type NavIcon = keyof typeof NAV_ICONS;
