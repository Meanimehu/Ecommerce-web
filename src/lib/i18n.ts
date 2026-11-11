/**
 * The two languages of the first release (Document 1, D-08). Every page lives under /en or /hi (Document 4, D4-01).
 */
export const LOCALES = ['en', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'hi';
}

/**
 * The language from the browser's preference, else English. For a visit with no prefix, `proxy.ts` first uses the
 * remembered choice (the language cookie) and only then this (Document 4, section 6).
 */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const quality = q === undefined ? 1 : Number(q.slice(2));
      return { language: tag.trim().toLowerCase().split('-')[0] ?? '', quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter((entry) => entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  const found = ranked.find((entry) => isLocale(entry.language));
  return found && isLocale(found.language) ? found.language : DEFAULT_LOCALE;
}

/** The first path segment when it is a language prefix, otherwise null. */
export function localeOfPath(pathname: string): Locale | null {
  const first = pathname.split('/')[1];
  return isLocale(first) ? first : null;
}

/**
 * The message catalogue: one file per language, the same keys in both (Document 4, section 6). Screens never hold text
 * of their own (Document 1, D-08). `npm run check:messages` fails when the two files differ in keys. The catalogues are
 * read on the server (lib/messages.ts); the browser gets only its page's language, through useMessages.
 */
export type Messages = typeof import('@/messages/en.json');
