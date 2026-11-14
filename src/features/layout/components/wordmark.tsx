import type { Locale } from '@/lib/i18n';

/** The Dhaaga wordmark (Document 6, 12.3; D6-57): the name as text in Outfit 600, ink, a link to the home page. */
export function Wordmark({ lang }: { lang: Locale }) {
  return (
    <a href={`/${lang}`} className="inline-flex h-11 items-center text-[22px] leading-6 font-semibold tracking-[-0.01em] text-ink no-underline sm:text-2xl sm:leading-7">
      Dhaaga
    </a>
  );
}
