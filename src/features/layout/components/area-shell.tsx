import { Shield, Store, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { NeedsScript } from '@/components/common/needs-script';
import type { Locale } from '@/lib/i18n';
import { getMessages, sectionMessages, type AreaSection } from '@/lib/messages';
import { MessagesProvider } from '@/lib/messages-context';
import { accountPath } from '@/lib/routes';
import { StaffArea } from '@/features/layout/menus';
import type { NavItem } from '@/features/layout/nav-items';
import { AreaMenuButton, AreaSideNav } from './area-nav';
import { HEADER_LINK_CLASS } from '@/features/layout/header-link';
import { LanguageSwitch } from './language-switch';
import { Wordmark } from './wordmark';

const AREA_ICONS = { [StaffArea.Admin]: Shield, [StaffArea.Vendor]: Store };

/**
 * The frame of the Vendor and Admin areas (Document 6, 7.3; approved Stage 4 and 5): a top bar on
 * surface with the wordmark, the area label with its icon ("Vendor area" with a shop, "Admin area"
 * with a shield, D5-15, D6-37), the language switch and the account; the side menu on the left (a
 * drawer below 1024 px). It gives the browser the text the whole area needs (`sections`, lib/messages.ts); an Admin
 * screen's folder adds its own.
 */
export function AreaShell({
  lang,
  area,
  nav,
  sections,
  children,
}: {
  lang: Locale;
  area: StaffArea;
  nav: readonly NavItem[];
  sections: readonly AreaSection[];
  children: ReactNode;
}) {
  const messages = getMessages(lang);
  const navMessages = messages.nav;
  const AreaIcon = AREA_ICONS[area];
  const areaLabel = area === StaffArea.Admin ? navMessages.adminArea : navMessages.vendorArea;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <AreaMenuButton
              items={nav}
              label={navMessages.menu}
              openLabel={navMessages.openMenu}
              closeLabel={navMessages.closeMenu}
              top={<LanguageSwitch lang={lang} />}
            />
            <Wordmark lang={lang} />
            <span className="inline-flex items-center gap-2 rounded-2 bg-sunken px-3 py-1.5 type-label text-ink">
              <AreaIcon aria-hidden="true" className="size-4" />
              {areaLabel}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="max-lg:hidden">
              <LanguageSwitch lang={lang} />
            </div>
            <a href={accountPath(lang)} className={HEADER_LINK_CLASS}>
              <UserRound aria-hidden="true" className="size-5" />
              <span className="max-sm:sr-only">{navMessages.account}</span>
            </a>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <AreaSideNav items={nav} label={navMessages.menu} />
        <main className="grid min-w-0 flex-1 content-start gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <NeedsScript messages={messages} />
          {/* The area's own text (lib/messages.ts). */}
          <MessagesProvider messages={sectionMessages(lang, sections)}>{children}</MessagesProvider>
        </main>
      </div>
    </div>
  );
}
