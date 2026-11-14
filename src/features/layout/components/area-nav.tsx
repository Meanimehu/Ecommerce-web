'use client';

import { Dialog as DialogPrimitive } from 'radix-ui';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { NAV_ICONS, type NavIcon } from '@/features/layout/nav-icons';

/**
 * The side menu of the Vendor and Admin areas (Document 5, section 5; Document 6, 7.3): 232 px on surface with a
 * hairline on expanded screens; below 1024 px a menu button opens it as a drawer from the left, with the language switch
 * above the list. It lists only the screens this person can use. The current screen has the madder bar, ink text and
 * sunken fill (Document 6, 8.1).
 */

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  /** Only this exact address counts as current (an area's home). */
  exact?: boolean;
}

function NavList({ items, label, onNavigate }: { items: readonly NavItem[]; label: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="grid gap-0.5">
        {items.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const current = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={onNavigate}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-2 border-s-[3px] px-3 type-small font-medium no-underline transition-colors duration-100',
                  current ? 'border-madder bg-sunken text-ink' : 'border-transparent text-ink-2 hover:bg-sunken hover:text-ink',
                )}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The menu on expanded screens. */
export function AreaSideNav({ items, label }: { items: readonly NavItem[]; label: string }) {
  return (
    <aside className="hidden w-[232px] shrink-0 border-e border-line bg-surface p-3 lg:block">
      <NavList items={items} label={label} />
    </aside>
  );
}

/** The menu button and drawer below 1024 px. `top` holds the language switch, shown above the list. */
export function AreaMenuButton({ items, label, openLabel, closeLabel, top }: { items: readonly NavItem[]; label: string; openLabel: string; closeLabel: string; top: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button type="button" className="inline-flex size-11 items-center justify-center rounded-2 text-ink transition-colors duration-100 hover:bg-sunken lg:hidden">
          <Menu aria-hidden="true" className="size-6" />
          <span className="sr-only">{openLabel}</span>
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim lg:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 start-0 z-50 grid w-[min(320px,85vw)] content-start gap-3 overflow-y-auto bg-surface p-3 shadow-overlay outline-none lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <DialogPrimitive.Title className="ps-3 type-label text-ink">{label}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="inline-flex size-11 items-center justify-center rounded-2 text-ink transition-colors duration-100 hover:bg-sunken">
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">{closeLabel}</span>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">{label}</DialogPrimitive.Description>
          <div className="border-b border-line pb-3">{top}</div>
          <NavList items={items} label={label} onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
