/** What `npm run check:messages` checks (Document 4, section 6; Document 7, D7-15). Not used by the site itself. */

/**
 * Backend error codes that the screens built so far can show (Document 7, D7-15). Each slice adds the codes of its
 * screens. `npm run check:messages` fails if one of these has no English or Hindi message, or is not a backend code.
 * By launch this list is the whole backend catalogue (src/types/generated/backend-error-codes.json).
 */
export const BACKEND_CODES_IN_USE = [
  // general (api-contract.md, section 11, "request shape and access")
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  // login, tokens and sessions (Area 1): Slice 1
  'PHONE_INVALID',
  'OTP_RESEND_WAIT',
  'OTP_RATE_LIMITED',
  'OTP_INVALID',
  'OTP_LOCKED',
  'OTP_EXPIRED',
  'SMS_UNAVAILABLE',
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'TOKEN_REUSED',
  'SESSION_ENDED',
  'USER_BLOCKED',
  // vendor application and admin vendor review (Area 2): Slice 2a
  'VENDOR_NOT_FOUND',
  'VENDOR_EXISTS',
  'GSTIN_TAKEN',
  'VENDOR_LOCKED',
  'VENDOR_ADDRESS_LIMIT',
  'VENDOR_ADDRESS_NOT_FOUND',
  'VENDOR_STATE_INVALID',
  'TERMS_VERSION_MISMATCH',
  'VENDOR_INCOMPLETE',
  'VENDOR_DOCUMENTS_PENDING',
  'DOCUMENT_NOT_FOUND',
  'DOCUMENT_REVIEWED',
  'DOCUMENT_NOT_SCANNED',
  'DOCUMENT_LIMIT',
  // file uploads and private files (Areas 2 and 3b): Slice 2a
  'FILE_REQUIRED',
  'FILE_TOO_LARGE',
  'FILE_TYPE_NOT_ALLOWED',
  'FILE_UNSAFE',
  'FILE_INFECTED',
  'FILE_UNAVAILABLE',
  'UPLOAD_RATE_LIMITED',
  'STORAGE_UNAVAILABLE',
  'SCAN_UNAVAILABLE',
  // admin catalogue lists (Area 3a): Slice 2b
  'CODE_TAKEN',
  'NAME_TAKEN',
  'SLUG_TAKEN',
  'TAX_INVALID',
  'CATEGORY_INVALID',
  'CATEGORY_NOT_FOUND',
  'BRAND_NOT_FOUND',
  'DICTIONARY_VALUE_NOT_FOUND',
  'ATTRIBUTE_SCHEMA_INVALID',
  // vendor products and moderation (Area 3b): Slice 2c
  'VENDOR_NOT_APPROVED',
  'PRODUCT_NOT_FOUND',
  'PRODUCT_LIMIT',
  'ATTRIBUTES_INVALID',
  'PRODUCT_LOCKED',
  'PRODUCT_STATE_INVALID',
  'PRODUCT_INCOMPLETE',
  'VARIANT_HAS_STOCK_HISTORY',
  'SKU_TAKEN',
  'VARIANT_DUPLICATE',
  'VARIANT_LIMIT',
  'PRICE_INVALID',
  'VARIANT_NOT_FOUND',
  'PRICE_CONFLICTS_WITH_SALE',
  'IMAGE_NOT_FOUND',
  'IMAGE_INVALID',
  'IMAGE_LIMIT',
  'REVIEW_STALE',
  'REVIEW_OWN_VENDOR',
  'TAX_CONFIRMATION_REQUIRED',
  // storefront and cart (Areas 3a and 5): Slice 2d
  'INSUFFICIENT_STOCK',
  'VARIANT_UNAVAILABLE',
  'CART_QUANTITY_LIMIT',
  'CART_LINE_LIMIT',
  'CART_ITEM_NOT_FOUND',
  // the account: profile and saved addresses (Area 1): Slice 3d
  'EMAIL_TAKEN',
  'ADDRESS_LIMIT',
  'ADDRESS_NOT_FOUND',
] as const;

/** Codes from the backend's framework, not in its catalogue (api-contract.md, section 3), that a built screen can show. */
export const FRAMEWORK_CODES_WITH_MESSAGES = ['TOO_MANY_REQUESTS', 'NOT_FOUND'] as const;

/** Frontend codes that need their own message (the others use the general messages by kind). */
export const FRONTEND_CODES_WITH_MESSAGES = [
  'CSRF_INVALID',
  'ORIGIN_INVALID',
  'SESSION_TEMPORARY',
  'UPLOAD_CANCELLED',
] as const;

/** Lists every key path whose value is text, for example "errors.viewTimeout". */
export function textKeys(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix];
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    textKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

export interface CatalogueProblem {
  key: string;
  problem: string;
}

/**
 * Compares two catalogues. Every key must exist in both, hold text in both, and never be empty. Anything else in the
 * files (numbers, lists, null) is reported, because the catalogue holds text only.
 */
export function compareCatalogues(
  names: [string, string],
  first: unknown,
  second: unknown,
): CatalogueProblem[] {
  const problems: CatalogueProblem[] = [];
  const collect = (value: unknown, prefix: string, name: string): void => {
    if (typeof value === 'string') {
      if (value.trim() === '') problems.push({ key: prefix, problem: `empty text in ${name}` });
      return;
    }
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      problems.push({ key: prefix || '(root)', problem: `not text or a group in ${name}` });
      return;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>))
      collect(child, prefix ? `${prefix}.${key}` : key, name);
  };
  collect(first, '', names[0]);
  collect(second, '', names[1]);
  const keysA = new Set(textKeys(first));
  const keysB = new Set(textKeys(second));
  for (const key of keysA)
    if (!keysB.has(key)) problems.push({ key, problem: `missing in ${names[1]}` });
  for (const key of keysB)
    if (!keysA.has(key)) problems.push({ key, problem: `missing in ${names[0]}` });
  return problems;
}
