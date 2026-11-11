import type { Locale } from '@/lib/i18n';
import { LanguageSwitch } from './language-switch';
import { Wordmark } from './wordmark';

/**
 * The storefront header as far as Slice 1 needs it (Document 6, 7.3): surface bar, the wordmark and the language switch,
 * with the stitch line under it. Search, account menu and cart arrive with the storefront screens (Slice 3). It is not
 * fixed, so it never covers content (D6-22).
 */
export function SiteHeader({ lang }: { lang: Locale }) {
  return (
    <header className="stitch-bottom bg-surface">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Wordmark lang={lang} />
        <LanguageSwitch lang={lang} />
      </div>
    </header>
  );
}
