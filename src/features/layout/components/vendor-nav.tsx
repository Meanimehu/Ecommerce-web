'use client';

import { ClipboardCheck, House, Layers, Package, Store, Tag, Ticket } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { NavIconSet } from '@/features/layout/nav-icons';
import { AreaMenuButton, AreaSideNav } from './area-nav';

/** The Vendor area's browser menu, with only the Vendor area's icons (`nav-icons.ts`). */
const VENDOR_NAV_ICONS: NavIconSet = {
  home: House,
  application: ClipboardCheck,
  profile: Store,
  products: Package,
  stock: Layers,
  sales: Tag,
  coupons: Ticket,
};

type WithoutIcons<T> = Omit<T, 'icons'>;

export function VendorSideNav(props: WithoutIcons<ComponentProps<typeof AreaSideNav>>) {
  return <AreaSideNav {...props} icons={VENDOR_NAV_ICONS} />;
}

export function VendorMenuButton(props: WithoutIcons<ComponentProps<typeof AreaMenuButton>>) {
  return <AreaMenuButton {...props} icons={VENDOR_NAV_ICONS} />;
}
