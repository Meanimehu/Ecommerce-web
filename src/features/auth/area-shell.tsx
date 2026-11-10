import type { ReactNode } from 'react';
import { LanguageSwitch } from '@/features/common/language-switch';
import type { Locale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';

/** The top bar of the Vendor and Admin areas, naming the area (Document 5, D5-15). The full shell comes with Stage 4. */
export function AreaShell({ lang, area, children }: { lang: Locale; area: 'vendor' | 'admin'; children: ReactNode }) {
  const t = getMessages(lang);
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex items-baseline gap-3">
          <a href={`/${lang}`} className="text-xl font-semibold">
            {t.site.wordmark}
          </a>
          <span className="text-sm">{area === 'admin' ? t.nav.adminArea : t.nav.vendorArea}</span>
        </div>
        <div className="flex items-center gap-4">
          <a href={`/${lang}/account`} className="text-sm underline underline-offset-4">
            {t.nav.account}
          </a>
          <LanguageSwitch lang={lang} />
        </div>
      </header>
      <main className="px-4 py-6">{children}</main>
    </div>
  );
}
