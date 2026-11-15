import en from '@/messages/en.json';
import hi from '@/messages/hi.json';
import type { Locale, Messages } from './i18n';

/**
 * The text of each language (Document 4, section 6), read on the server. Server pages use getMessages directly; the
 * browser gets the text through MessagesProvider (lib/messages-context.tsx), and only for its page's language.
 */
const catalogues: Record<Locale, Messages> = { en, hi };

export function getMessages(locale: Locale): Messages {
  return catalogues[locale];
}

/**
 * Text used only inside the Vendor and Admin areas. The storefront's pages do not carry it to the browser: those two
 * areas add it in their own layouts (Document 6, section 14: the page-size budget).
 */
export const AREA_SECTIONS = [
  'vendor',
  'adminVendors',
  'catalogue',
  'product',
  'moderation',
] as const satisfies readonly (keyof Messages)[];

/**
 * Text used only on some storefront pages, which add it themselves: `store` on the shop's pages, `cart` on the cart
 * page, `account` on the account pages. The other pages, such as login, do not carry it (Document 6, section 14).
 */
export const PAGE_SECTIONS = ['store', 'cart', 'account'] as const satisfies readonly (keyof Messages)[];

const NOT_SHARED: readonly string[] = [...AREA_SECTIONS, ...PAGE_SECTIONS];

/** The text every page carries to the browser: everything except the area-only and page-only sections. */
export function sharedMessages(locale: Locale): Partial<Messages> {
  const all = getMessages(locale);
  return Object.fromEntries(
    Object.entries(all).filter(([key]) => !NOT_SHARED.includes(key)),
  ) as Partial<Messages>;
}

/** The area-only text, for the Vendor and Admin layouts. */
export function areaMessages(locale: Locale): Partial<Messages> {
  return sectionMessages(locale, AREA_SECTIONS);
}

/** Some sections of the text, for a page that adds them (PAGE_SECTIONS). */
export function sectionMessages(
  locale: Locale,
  sections: readonly (keyof Messages)[],
): Partial<Messages> {
  const all = getMessages(locale);
  return Object.fromEntries(sections.map((key) => [key, all[key]])) as Partial<Messages>;
}
