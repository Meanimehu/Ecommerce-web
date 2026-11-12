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
export const AREA_SECTIONS = ['vendor', 'adminVendors', 'catalogue', 'product', 'moderation'] as const satisfies readonly (keyof Messages)[];

/** The text every page carries to the browser: everything except the area-only sections. */
export function sharedMessages(locale: Locale): Partial<Messages> {
  const all = getMessages(locale);
  return Object.fromEntries(Object.entries(all).filter(([key]) => !(AREA_SECTIONS as readonly string[]).includes(key))) as Partial<Messages>;
}

/** The area-only text, for the Vendor and Admin layouts. */
export function areaMessages(locale: Locale): Partial<Messages> {
  const all = getMessages(locale);
  return Object.fromEntries(AREA_SECTIONS.map((key) => [key, all[key]])) as Partial<Messages>;
}
