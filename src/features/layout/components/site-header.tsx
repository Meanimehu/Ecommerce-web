import type { Locale } from '@/lib/i18n';
import { HeaderActions } from './header-actions';
import { LanguageSwitch } from './language-switch';
import { Wordmark } from './wordmark';

/**
 * The storefront header (Document 6, 7.3): surface bar with the wordmark, the language switch, "Log in" or the account,
 * and the cart with its count, with the stitch line under it. Search and the category row arrive in Slice 3. It is not
 * fixed, so it never covers content (D6-22).
 */
export function SiteHeader({ lang }: { lang: Locale }) {
  return (
    <header className="stitch-bottom bg-surface">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Wordmark lang={lang} />
        <div className="flex items-center gap-1">
          <LanguageSwitch lang={lang} />
          <HeaderActions lang={lang} />
        </div>
      </div>
    </header>
  );
}
