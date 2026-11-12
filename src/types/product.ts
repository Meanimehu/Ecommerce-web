import { z } from 'zod';
import { AttributeSchema } from './catalogue';
import { pageOf } from './common';

/**
 * Backend Area 3b, vendor products and moderation: response shapes written by hand from the API reference (D3-01),
 * and the product form. Source: Meanimehu/Ecommerce docs/api/reference/area-3b-products.md, "Shapes used below" and
 * each endpoint. Revisions (changes to an approved product) arrive in Slice 4.
 */
export const PRODUCT_STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'unpublished'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const VariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sku: z.string(),
  barcode: z.string().nullable(),
  sizeCode: z.string().nullable(),
  colourCode: z.string().nullable(),
  pricePaise: z.number().int(),
  mrpPaise: z.number().int(),
  weightGrams: z.number().int().nullable(),
  status: z.enum(['active', 'inactive']),
});
export type Variant = z.infer<typeof VariantSchema>;

export const PhotoSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sortOrder: z.number().nullable(),
  isCover: z.boolean(),
  altText: z.string().nullable(),
  state: z.string(),
});
export type Photo = z.infer<typeof PhotoSchema>;

const productFields = {
  id: z.string(),
  status: z.enum(PRODUCT_STATUSES),
  statusReason: z.string().nullable(),
  unpublishedBy: z.string().nullable(),
  categoryId: z.string(),
  brandId: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  attributes: z.record(z.string(), z.unknown()),
  hsnCode: z.string().nullable(),
  gstRateBps: z.number().int().nullable(),
  taxSource: z.string(),
  submittedAt: z.string().nullable(),
  approvedAt: z.string().nullable(),
  updatedAt: z.string(),
};

/** The vendor's view of a product: list items add variantCount and missing; the full view adds variants and photos. */
export const ProductSchema = z.object(productFields);
export const ProductRowSchema = z.object({ ...productFields, variantCount: z.number().int(), missing: z.array(z.string()) });
export const ProductViewSchema = z.object({ ...productFields, variants: z.array(VariantSchema), images: z.array(PhotoSchema), missing: z.array(z.string()) });
export const ProductPageSchema = pageOf(ProductRowSchema);
export type Product = z.infer<typeof ProductSchema>;
export type ProductRow = z.infer<typeof ProductRowSchema>;
export type ProductView = z.infer<typeof ProductViewSchema>;

/** GET /catalogue/dictionaries: what the product form offers (active entries only). */
type DictionaryCategory = { id: string; name: string; slug: string; attributes: z.infer<typeof AttributeSchema>[]; effectiveTax: { hsnCode: string | null; gstRateBps: number | null; inactive: string[] }; children: DictionaryCategory[] };
const DictionaryCategorySchema: z.ZodType<DictionaryCategory> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    attributes: z.array(AttributeSchema),
    effectiveTax: z.object({ hsnCode: z.string().nullable(), gstRateBps: z.number().int().nullable(), inactive: z.array(z.string()) }),
    children: z.array(DictionaryCategorySchema),
  }),
);
export const DictionariesSchema = z.object({
  categories: z.array(DictionaryCategorySchema),
  brands: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })),
  sizes: z.array(z.object({ code: z.string(), label: z.string(), sizeGroup: z.string() })),
  colours: z.array(z.object({ code: z.string(), label: z.string(), hex: z.string().nullable() })),
  gstRates: z.array(z.object({ rateBps: z.number().int(), label: z.string() })),
  hsnCodes: z.array(z.object({ code: z.string(), description: z.string(), defaultGstRateBps: z.number().int().nullable() })),
});
export type Dictionaries = z.infer<typeof DictionariesSchema>;
export type { DictionaryCategory };

/** Every category of the tree with its path ("Women › Kurtas"), in display order. */
export function flattenCategories(nodes: readonly DictionaryCategory[], parents: string[] = []): { category: DictionaryCategory; path: string }[] {
  return nodes.flatMap((node) => [{ category: node, path: [...parents, node.name].join(' › ') }, ...flattenCategories(node.children, [...parents, node.name])]);
}

// ---- Moderation (section 7) ----

export const ModerationRowSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  categoryId: z.string(),
  status: z.enum(PRODUCT_STATUSES),
  title: z.string(),
  submittedAt: z.string().nullable(),
  updatedAt: z.string(),
});
export const ModerationPageSchema = pageOf(ModerationRowSchema);
export type ModerationRow = z.infer<typeof ModerationRowSchema>;

export const ReviewPhotoSchema = z.object({ id: z.string(), state: z.string(), sortOrder: z.number().nullable(), altText: z.string().nullable(), isCover: z.boolean() });
export const ModerationViewSchema = z.object({
  product: ProductSchema,
  vendor: z.object({ id: z.string(), displayName: z.string(), status: z.string() }),
  /** listing or revision; null when nothing is waiting for a decision. */
  awaiting: z.string().nullable(),
  seenUpdatedAt: z.string(),
  images: z.object({ live: z.array(ReviewPhotoSchema), proposed: z.array(ReviewPhotoSchema).nullable() }),
  variants: z.array(VariantSchema),
  /** What the version under review lacks; null when nothing is under review. */
  missing: z.array(z.string()).nullable(),
  taxConfirmationRequired: z.boolean(),
});
export type ModerationView = z.infer<typeof ModerationViewSchema>;

// ---- The product form (Document 5, section 7.3). Only cheap, certain checks; the backend decides the rest. ----

const text = z.string().trim();

export const BasicsSchema = z
  .object({
    title: text.min(1, 'validation.required'),
    categoryId: z.string().min(1, 'validation.choose'),
    brandId: z.string(),
    description: text,
    hsnCode: z.string(),
    gstRateBps: z.string(),
  })
  // The backend takes an own tax classification only as a pair (area-3b-products.md, POST /vendors/me/products).
  .refine((v) => (v.hsnCode === '') === (v.gstRateBps === ''), { path: ['gstRateBps'], message: 'validation.taxPair' });
export type BasicsInput = z.input<typeof BasicsSchema>;

/** Rupees as typed ("1499" or "1,499.50") to whole paise, without floating point (D-15; Document 3, section 7). */
export function rupeesToPaise(value: string): number | null {
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(value.trim().replace(/,/g, ''));
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

/** Paise back to rupees for a form field: "1499" or "1499.50". */
export function paiseToRupees(paise: number): string {
  const rupees = Math.trunc(paise / 100);
  const rest = paise % 100;
  return rest === 0 ? String(rupees) : `${rupees}.${String(rest).padStart(2, '0')}`;
}

const money = text.min(1, 'validation.required').refine((v) => rupeesToPaise(v) !== null, 'validation.moneyShape');

export const VariantFormSchema = z.object({
  sizeCode: z.string(),
  colourCode: z.string(),
  sku: text.min(1, 'validation.required'),
  mrp: money,
  price: money,
});
export type VariantInput = z.input<typeof VariantFormSchema>;
