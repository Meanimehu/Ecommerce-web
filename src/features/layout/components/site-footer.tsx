import type { Locale } from '@/lib/i18n';
import { LanguageSwitch } from './language-switch';
import { Wordmark } from './wordmark';

/**
 * The storefront footer (Document 6, 7.3): the wordmark and the language switch, at every size.
 * The approved screens also show About, Help, Terms and Privacy; no such pages exist yet, so no
 * link is shown (Document 8, Slice 3 notes).
 */
export function SiteFooter({ lang }: { lang: Locale }) {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6 lg:px-8">
        <Wordmark lang={lang} />
        <LanguageSwitch lang={lang} />
      </div>
    </footer>
  );
}
