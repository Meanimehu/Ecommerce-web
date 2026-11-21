import { isLocale, type Locale } from '@/lib/i18n';
import { withQuery } from '@/utils/url';

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

/** The vendor's CSV imports: the template, an upload and the imports so far. */
export const myImportsPath = (lang: Locale) => `/${lang}/vendor/imports`;

/** One import: its check, and after confirm what was created. */
export const myImportPath = (lang: Locale, id: string) =>
  `${myImportsPath(lang)}/${encodeURIComponent(id)}`;

/** The coupons that charge the vendor. */
export const myCouponsPath = (lang: Locale) => `/${lang}/vendor/coupons`;

/** The vendor's stock, one row per variant. */
export const myStockPath = (lang: Locale) => `/${lang}/vendor/stock`;

/** The bulk update by SKU. */
export const bulkStockPath = (lang: Locale) => `${myStockPath(lang)}/bulk`;

/** Change one variant's stock. The product's id lets the page find the variant's row. */
export const variantStockPath = (lang: Locale, productId: string, variantId: string) =>
  `${myStockPath(lang)}/${encodeURIComponent(productId)}/${encodeURIComponent(variantId)}`;

/** One variant's stock history. */
export const stockHistoryPath = (lang: Locale, productId: string, variantId: string) =>
  `${variantStockPath(lang, productId, variantId)}/history`;

/** The vendor's sale prices, and a new one. */
export const mySalesPath = (lang: Locale) => `/${lang}/vendor/sales`;

export const newSalePath = (lang: Locale) => `${mySalesPath(lang)}/new`;

// ---- Admin area ----

export const adminHomePath = (lang: Locale) => `/${lang}/admin`;

export const adminUsersPath = (lang: Locale) => `/${lang}/admin/users`;

export const adminUserPath = (lang: Locale, id: string) =>
  `${adminUsersPath(lang)}/${encodeURIComponent(id)}`;

/** The audit log, filtered by these values when given (only those set go in the address). */
export const adminAuditLogPath = (
  lang: Locale,
  filters?: { entityId?: string; actorId?: string },
) => withQuery(`/${lang}/admin/audit-log`, filters);

export const adminSalesPath = (lang: Locale) => `/${lang}/admin/sales`;

/** Every coupon, filtered by these values when given (only those set go in the address). */
export const adminCouponsPath = (
  lang: Locale,
  filters?: { status?: string; code?: string; vendorId?: string },
) => withQuery(`/${lang}/admin/coupons`, filters);

export const newAdminCouponPath = (lang: Locale) => `/${lang}/admin/coupons/new`;

export const adminCouponPath = (lang: Locale, id: string) =>
  `/${lang}/admin/coupons/${encodeURIComponent(id)}`;

export const changeAdminCouponPath = (lang: Locale, id: string) =>
  `${adminCouponPath(lang, id)}/change`;

/** Any variant's stock history, for staff; reached by links only (Document 8, Slice 5 notes). */
export const staffStockHistoryPath = (lang: Locale, variantId: string) =>
  `/${lang}/admin/inventory/variants/${encodeURIComponent(variantId)}`;

export const adminVendorsPath = (lang: Locale) => `/${lang}/admin/vendors`;

export const adminVendorPath = (lang: Locale, id: string) =>
  `${adminVendorsPath(lang)}/${encodeURIComponent(id)}`;

/** The catalogue lists, or one of them by its address word (`categories`, `brands`, …). */
export const adminCataloguePath = (lang: Locale, list?: string) =>
  list ? `/${lang}/admin/catalogue/${list}` : `/${lang}/admin/catalogue`;

export const moderationQueuePath = (lang: Locale) => `/${lang}/admin/moderation`;

export const moderationProductPath = (lang: Locale, id: string) =>
  `${moderationQueuePath(lang)}/${encodeURIComponent(id)}`;
