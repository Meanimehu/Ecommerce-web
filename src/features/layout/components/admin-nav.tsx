'use client';

import {
  ClipboardList,
  Eye,
  House,
  ScrollText,
  Store,
  Tag,
  Tags,
  Ticket,
  Users,
} from 'lucide-react';
import type { ComponentProps } from 'react';
import type { NavIconSet } from '@/features/layout/nav-icons';
import { AreaMenuButton, AreaSideNav } from './area-nav';

/** The Admin area's browser menu, with only the Admin area's icons (`nav-icons.ts`). */
const ADMIN_NAV_ICONS: NavIconSet = {
  home: House,
  users: Users,
  audit: ScrollText,
  vendors: Store,
  catalogue: Tags,
  moderation: Eye,
  sales: Tag,
  coupons: Ticket,
  couponRequests: ClipboardList,
};

type WithoutIcons<T> = Omit<T, 'icons'>;

export function AdminSideNav(props: WithoutIcons<ComponentProps<typeof AreaSideNav>>) {
  return <AreaSideNav {...props} icons={ADMIN_NAV_ICONS} />;
}

export function AdminMenuButton(props: WithoutIcons<ComponentProps<typeof AreaMenuButton>>) {
  return <AreaMenuButton {...props} icons={ADMIN_NAV_ICONS} />;
}
