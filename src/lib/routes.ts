import { isLocale, type Locale } from '@/lib/i18n';

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

/** The same page in another language (the language switch, Document 4, section 6). */
export function samePageIn(pathname: string, lang: Locale): string {
  const [, firstPart, ...rest] = pathname.split('/');
  return isLocale(firstPart) ? ['', lang, ...rest].join('/') : pathname;
}

/** The login page; `nextPage` is where to return after login (Document 4, section 9). */
export const loginPath = (lang: Locale, nextPage?: string) =>
  nextPage ? `/${lang}/login?next=${encodeURIComponent(nextPage)}` : `/${lang}/login`;

export const accountPath = (lang: Locale) => `/${lang}/account`;

export const accountAddressesPath = (lang: Locale) => `/${lang}/account/addresses`;

export const accountSecurityPath = (lang: Locale) => `/${lang}/account/security`;

export const cartPath = (lang: Locale) => `/${lang}/cart`;

// ---- Storefront (Document 4, D4-02) ----

/** A category page, by the backend's category slug. */
export const categoryPath = (lang: Locale, slug: string) => `/${lang}/category/${slug}`;

/** The search results for some text; with no text, the search page itself. */
export const searchPath = (lang: Locale, text?: string) =>
  text ? `/${lang}/search?q=${encodeURIComponent(text)}` : `/${lang}/search`;

/** A brand page, by the backend's brand slug. */
export const brandPath = (lang: Locale, slug: string) => `/${lang}/brand/${slug}`;

/** The readable part of a product address is at most this long. */
const PRODUCT_SLUG_MAX_LENGTH = 80;
/** The readable part for a title with no Latin letters or digits (for example one fully in Hindi). */
const PRODUCT_SLUG_FALLBACK = 'product';

/**
 * The readable part of a product address: from the title, lower-case Latin letters and digits
 * joined by hyphens. It is only for people and search engines; the id is what is looked up.
 */
export function productSlug(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, PRODUCT_SLUG_MAX_LENGTH)
    .replace(/-+$/g, '');
  return slug || PRODUCT_SLUG_FALLBACK;
}

/** A product page: the full id, then the readable name. */
export const productPath = (lang: Locale, id: string, title: string) =>
  `/${lang}/product/${id}/${productSlug(title)}`;

// ---- Vendor area ----

export const vendorHomePath = (lang: Locale) => `/${lang}/vendor`;

/** The vendor application, at one of its steps or where the applicant stands. */
export const vendorApplyPath = (lang: Locale, step?: string) =>
  withStep(`/${lang}/vendor/apply`, step);

/** The vendor's business profile: details, addresses and documents. */
export const vendorProfilePath = (lang: Locale) => `/${lang}/vendor/profile`;

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
