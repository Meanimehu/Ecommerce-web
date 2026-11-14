import type { Locale } from '@/lib/i18n';

/**
 * Every page address of our site, one helper per kind of page (Document 7, 20.2; Document 4,
 * section 5). Pages, screens, hooks and the server use these and never write an address by hand,
 * so a renamed address changes here only.
 *
 * Two rules: this file imports no feature (D7-17), so a step or a list comes in as plain text from
 * the screen that knows its enum; and it has no server-only code and no Zod, because `proxy.ts`
 * uses it. A helper is added by the step that first needs it. Query strings for list filters and
 * pages stay with `withQuery` (`utils/url.ts`), on top of these addresses.
 */

/** A form with steps keeps its step in the address: `?step=address`. */
const withStep = (path: string, step?: string) => (step ? `${path}?step=${step}` : path);

// ---- Everyone ----

export const homePath = (lang: Locale) => `/${lang}`;

/** The login page; `nextPage` is where to return after login (Document 4, section 9). */
export const loginPath = (lang: Locale, nextPage?: string) =>
  nextPage ? `/${lang}/login?next=${encodeURIComponent(nextPage)}` : `/${lang}/login`;

export const accountPath = (lang: Locale) => `/${lang}/account`;

// ---- Vendor area ----

export const vendorHomePath = (lang: Locale) => `/${lang}/vendor`;

/** The vendor application, at one of its steps or where the applicant stands. */
export const vendorApplyPath = (lang: Locale, step?: string) =>
  withStep(`/${lang}/vendor/apply`, step);

export const myProductsPath = (lang: Locale) => `/${lang}/vendor/products`;

export const addProductPath = (lang: Locale) => `/${lang}/vendor/products/add`;

/** One of the vendor's products, at one of its steps or the step it needs next. */
export const myProductPath = (lang: Locale, id: string, step?: string) =>
  withStep(`${myProductsPath(lang)}/${encodeURIComponent(id)}`, step);

// ---- Admin area ----

export const adminHomePath = (lang: Locale) => `/${lang}/admin`;

export const adminVendorsPath = (lang: Locale) => `/${lang}/admin/vendors`;

export const adminVendorPath = (lang: Locale, id: string) =>
  `${adminVendorsPath(lang)}/${encodeURIComponent(id)}`;

/** The catalogue lists, or one of them by its address word (`categories`, `brands`, …). */
export const adminCataloguePath = (lang: Locale, list?: string) =>
  list ? `/${lang}/admin/catalogue/${list}` : `/${lang}/admin/catalogue`;

export const moderationQueuePath = (lang: Locale) => `/${lang}/admin/moderation`;

export const moderationProductPath = (lang: Locale, id: string) =>
  `${moderationQueuePath(lang)}/${encodeURIComponent(id)}`;
