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
 * Text used only inside the Vendor and Admin areas. The storefront's pages do not carry it to the browser, and a staff
 * page carries only the sections its screens use (Document 6, section 14: the page-size budget): the Vendor area's
 * layout adds VENDOR_AREA_SECTIONS, and each Admin screen's folder adds its own ADMIN_SCREEN_SECTIONS.
 */
export const AREA_SECTIONS = [
  'vendor',
  'adminVendors',
  'catalogue',
  'product',
  'moderation',
  'stock',
  'sales',
  'users',
  'audit',
] as const satisfies readonly (keyof Messages)[];

/**
 * Text used only on some storefront pages, which add it themselves: `store` on the shop's pages, `cart` on the cart
 * page, `account` on the account pages. The other pages, such as login, do not carry it (Document 6, section 14).
 */
export const PAGE_SECTIONS = [
  'store',
  'cart',
  'account',
] as const satisfies readonly (keyof Messages)[];

export type AreaSection = (typeof AREA_SECTIONS)[number];

/** The Vendor area's text. Its screens link to each other and share parts, so its layout carries all of it. */
export const VENDOR_AREA_SECTIONS = [
  'vendor',
  'product',
  'catalogue',
  'stock',
  'sales',
] as const satisfies readonly AreaSection[];

/**
 * Each Admin screen's text, by its folder under `app/[lang]/admin/`: that folder's layout adds it, so one admin page
 * never carries another screen's text. The Admin home needs none of it.
 */
export const ADMIN_SCREEN_SECTIONS = {
  users: ['users'],
  'audit-log': ['audit', 'users'],
  vendors: ['adminVendors', 'vendor'],
  catalogue: ['catalogue'],
  moderation: ['moderation', 'product', 'catalogue', 'vendor', 'adminVendors'],
  sales: ['sales'],
  inventory: ['stock'],
} as const satisfies Record<string, readonly AreaSection[]>;

const NOT_SHARED: readonly string[] = [...AREA_SECTIONS, ...PAGE_SECTIONS];

/** The text every page carries to the browser: everything except the area-only and page-only sections. */
export function sharedMessages(locale: Locale): Partial<Messages> {
  const all = getMessages(locale);
  return Object.fromEntries(
    Object.entries(all).filter(([key]) => !NOT_SHARED.includes(key)),
  ) as Partial<Messages>;
}

/** Some sections of the text, for a page that adds them (PAGE_SECTIONS). */
export function sectionMessages(
  locale: Locale,
  sections: readonly (keyof Messages)[],
): Partial<Messages> {
  const all = getMessages(locale);
  return Object.fromEntries(sections.map((key) => [key, all[key]])) as Partial<Messages>;
}
