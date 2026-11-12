import { Shield, Store, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { LanguageSwitch } from '@/components/common/language-switch';
import { NeedsScript } from '@/components/common/needs-script';
import { Wordmark } from '@/components/common/wordmark';
import { getMessages, type Locale } from '@/lib/i18n';
import { AreaMenuButton, AreaSideNav, type NavItem } from './area-nav';

/**
 * The frame of the Vendor and Admin areas (Document 6, 7.3; approved Stage 4 and 5): a top bar on surface with the
 * wordmark, the area label with its icon ("Vendor area" with a shop, "Admin area" with a shield, D5-15, D6-37), the
 * language switch and the account; the side menu on the left (a drawer below 1024 px).
 */
export function AreaShell({ lang, area, nav, children }: { lang: Locale; area: 'vendor' | 'admin'; nav: readonly NavItem[]; children: ReactNode }) {
  const t = getMessages(lang);
  const AreaIcon = area === 'admin' ? Shield : Store;
  const areaLabel = area === 'admin' ? t.nav.adminArea : t.nav.vendorArea;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <AreaMenuButton items={nav} label={t.nav.menu} openLabel={t.nav.openMenu} closeLabel={t.nav.closeMenu} top={<LanguageSwitch lang={lang} />} />
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
            <a href={`/${lang}/account`} className="inline-flex h-11 items-center gap-2 rounded-2 px-2 type-label text-ink no-underline transition-colors duration-100 hover:bg-sunken">
              <UserRound aria-hidden="true" className="size-5" />
              <span className="max-sm:sr-only">{t.nav.account}</span>
            </a>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <AreaSideNav items={nav} label={t.nav.menu} />
        <main className="grid min-w-0 flex-1 content-start gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <NeedsScript t={t} />
          {children}
        </main>
      </div>
    </div>
  );
}
