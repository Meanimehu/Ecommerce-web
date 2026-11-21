import { z } from 'zod';
import { AttributeSchema, AttributeType, type Attribute } from '@/features/catalogue/types';
import type { AppError } from '@/lib/errors';
import { pageOf } from '@/types/common';
import type { components } from '@/types/generated/backend-api';

/**
 * Backend Area 3b, vendor products and moderation: response shapes written by hand from the API
 * reference (D3-01), the product forms, and small rules the screens and hooks share. Source:
 * Meanimehu/Ecommerce docs/api/reference/area-3b-products.md, "Shapes used below" and each
 * endpoint. Extra fields are ignored; a missing or wrong required field is a mismatch (D3-02). The
 * enum values are the backend's own words. Revisions (changes to an approved product) arrive in
 * Slice 4.
 */

export enum ProductStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Approved = 'approved',
  Rejected = 'rejected',
  Unpublished = 'unpublished',
}

export const PRODUCT_STATUSES: readonly ProductStatus[] = Object.values(ProductStatus);

export enum VariantStatus {
  Active = 'active',
  Inactive = 'inactive',
}

/** Where a product's HSN code and GST rate come from ("Tax"). */
export enum TaxSource {
  CategoryDefault = 'category_default',
  VendorDeclared = 'vendor_declared',
}

/** What waits for a moderator's decision: a new listing, or a change to a live product. */
export enum ReviewKind {
  Listing = 'listing',
  Revision = 'revision',
}

/** A moderator's decision; each is its own backend address (section 7). */
export enum ProductDecision {
  Approve = 'approve',
  Reject = 'reject',
}

export function isProductDecision(value: string): value is ProductDecision {
  return (Object.values(ProductDecision) as string[]).includes(value);
}

/** The stored photo sizes (section 4). */
export enum PhotoSize {
  Thumb = 'thumb',
  Medium = 'medium',
  Large = 'large',
}

/** The size a photo address asks for; anything else gets the medium one. */
export function photoSizeOf(value: string | null): PhotoSize {
  if (value === PhotoSize.Thumb || value === PhotoSize.Large) return value;
  return PhotoSize.Medium;
}

/** The most photos one product may have (section 4). */
export const MAX_PHOTOS = 8;

// ---- What the backend sends ----

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
  status: z.enum(VariantStatus),
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
  status: z.enum(ProductStatus),
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

/**
 * The vendor's view of a product: list items add variantCount and missing; the full view adds
 * variants and photos.
 */
export const ProductSchema = z.object(productFields);
export const ProductRowSchema = z.object({
  ...productFields,
  variantCount: z.number().int(),
  missing: z.array(z.string()),
});
export const ProductViewSchema = z.object({
  ...productFields,
  variants: z.array(VariantSchema),
  images: z.array(PhotoSchema),
  missing: z.array(z.string()),
});
export const ProductPageSchema = pageOf(ProductRowSchema);
export type Product = z.infer<typeof ProductSchema>;
export type ProductRow = z.infer<typeof ProductRowSchema>;
export type ProductView = z.infer<typeof ProductViewSchema>;
/** The content a product's basics form and a revision both hold. */
export type ProductContent = Pick<
  ProductView,
  'title' | 'categoryId' | 'brandId' | 'description' | 'hsnCode' | 'gstRateBps' | 'taxSource'
>;

/** GET /catalogue/dictionaries: what the product form offers (active entries only). */
export type DictionaryCategory = {
  id: string;
  name: string;
  slug: string;
  attributes: Attribute[];
  effectiveTax: { hsnCode: string | null; gstRateBps: number | null; inactive: string[] };
  children: DictionaryCategory[];
};
const DictionaryCategorySchema: z.ZodType<DictionaryCategory> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    attributes: z.array(AttributeSchema),
    effectiveTax: z.object({
      hsnCode: z.string().nullable(),
      gstRateBps: z.number().int().nullable(),
      inactive: z.array(z.string()),
    }),
    children: z.array(DictionaryCategorySchema),
  }),
);
export const DictionariesSchema = z.object({
  categories: z.array(DictionaryCategorySchema),
  brands: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })),
  sizes: z.array(z.object({ code: z.string(), label: z.string(), sizeGroup: z.string() })),
  colours: z.array(z.object({ code: z.string(), label: z.string(), hex: z.string().nullable() })),
  gstRates: z.array(z.object({ rateBps: z.number().int(), label: z.string() })),
  hsnCodes: z.array(
    z.object({
      code: z.string(),
      description: z.string(),
      defaultGstRateBps: z.number().int().nullable(),
    }),
  ),
});
export type Dictionaries = z.infer<typeof DictionariesSchema>;

/** A size or colour of the dictionaries: a code and what people read. */
export type DictionaryEntry = { code: string; label: string };

// ---- Moderation (section 7) ----

export const ModerationRowSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  categoryId: z.string(),
  status: z.enum(ProductStatus),
  title: z.string(),
  submittedAt: z.string().nullable(),
  updatedAt: z.string(),
});
export const ModerationPageSchema = pageOf(ModerationRowSchema);
export type ModerationRow = z.infer<typeof ModerationRowSchema>;

export const ReviewPhotoSchema = z.object({
  id: z.string(),
  state: z.string(),
  sortOrder: z.number().nullable(),
  altText: z.string().nullable(),
  isCover: z.boolean(),
});
export const ModerationViewSchema = z.object({
  product: ProductSchema,
  vendor: z.object({ id: z.string(), displayName: z.string(), status: z.string() }),
  /** listing or revision; null when nothing is waiting for a decision. */
  awaiting: z.string().nullable(),
  seenUpdatedAt: z.string(),
  images: z.object({
    live: z.array(ReviewPhotoSchema),
    proposed: z.array(ReviewPhotoSchema).nullable(),
  }),
  variants: z.array(VariantSchema),
  /** What the version under review lacks; null when nothing is under review. */
  missing: z.array(z.string()).nullable(),
  taxConfirmationRequired: z.boolean(),
});
export type ModerationView = z.infer<typeof ModerationViewSchema>;

// ---- Revisions: changes to an approved product (area-3b-products.md, section 5) ----

/** Where a revision stands. */
export enum RevisionStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Rejected = 'rejected',
}

/** A photo of a revision: kept from the live product, newly proposed, or marked for removal. */
export enum RevisionPhotoState {
  Live = 'live',
  PendingAdd = 'pending_add',
  PendingRemove = 'pending_remove',
}

/** The content fields a revision can change, in the order the screens show them. */
export enum RevisionField {
  Title = 'title',
  CategoryId = 'categoryId',
  BrandId = 'brandId',
  Description = 'description',
  Attributes = 'attributes',
  HsnCode = 'hsnCode',
  GstRateBps = 'gstRateBps',
}

export const RevisionPhotoSchema = z.object({
  id: z.string(),
  state: z.string(),
  sortOrder: z.number().nullable(),
  isCover: z.boolean(),
  altText: z.string().nullable(),
});
export type RevisionPhoto = z.infer<typeof RevisionPhotoSchema>;

/** The proposed gallery (cover first) and the live photos the revision takes away. */
export const RevisionGallerySchema = z.object({
  images: z.array(RevisionPhotoSchema),
  removed: z.array(RevisionPhotoSchema),
});
export type RevisionGallery = z.infer<typeof RevisionGallerySchema>;

export const RevisionSchema = RevisionGallerySchema.extend({
  status: z.enum(RevisionStatus),
  reason: z.string().nullable(),
  submittedAt: z.string().nullable(),
  content: z.object({
    categoryId: z.string(),
    brandId: z.string().nullable(),
    title: z.string(),
    description: z.string().nullable(),
    attributes: z.record(z.string(), z.unknown()),
    hsnCode: z.string().nullable(),
    gstRateBps: z.number().int().nullable(),
    taxSource: z.string(),
  }),
  /** The content fields that differ from the live product. */
  changes: z.array(z.string()),
  photoChanges: z.object({
    added: z.array(z.string()),
    removed: z.array(z.string()),
    reordered: z.boolean(),
    altTextChanged: z.array(z.string()),
  }),
  missing: z.array(z.string()),
});
export type Revision = z.infer<typeof RevisionSchema>;
export type RevisionContent = Revision['content'];

/** A revision can be edited, submitted and discarded while it is a draft or was rejected. */
export function canEditRevision(status: RevisionStatus): boolean {
  return status === RevisionStatus.Draft || status === RevisionStatus.Rejected;
}

/** Whether the revision changes its photos at all. */
export function changesPhotos(revision: Revision): boolean {
  const { added, removed, reordered, altTextChanged } = revision.photoChanges;
  return added.length > 0 || removed.length > 0 || reordered || altTextChanged.length > 0;
}

// ---- What the frontend sends: from the generated backend types (D7-02) ----

type BackendSchemas = components['schemas'];

export type CreateProductBody = BackendSchemas['CreateProductDto'];
export type ChangeProductBody = BackendSchemas['UpdateProductDto'];
export type AddVariantBody = BackendSchemas['CreateVariantDto'];
/**
 * The generated type gives both prices as `Record<string, never>`, because the backend's API
 * description does not say what they are. They are whole paise, as in a new variant.
 */
export type ChangeVariantBody = Omit<
  BackendSchemas['UpdateVariantDto'],
  'pricePaise' | 'mrpPaise'
> & {
  pricePaise?: number;
  mrpPaise?: number;
};
export type ChangePhotoBody = BackendSchemas['UpdateMediaDto'];
export type OrderPhotosBody = BackendSchemas['ReorderMediaDto'];
export type ApproveProductBody = BackendSchemas['ApproveProductDto'];
export type RejectProductBody = BackendSchemas['RejectProductDto'];

/** A decision and the body its address takes. */
export type ProductDecisionInput =
  | { decision: ProductDecision.Approve; body: ApproveProductBody }
  | { decision: ProductDecision.Reject; body: RejectProductBody };

// ---- The product form's steps (Document 5, section 7.3) ----

export enum ProductStep {
  Basics = 'basics',
  Attributes = 'attributes',
  Variants = 'variants',
  Photos = 'photos',
  Review = 'review',
}

/** The five steps, in order. */
export const PRODUCT_STEPS: readonly ProductStep[] = Object.values(ProductStep);

export function isProductStep(value: string | null): value is ProductStep {
  return value !== null && (PRODUCT_STEPS as readonly string[]).includes(value);
}

/**
 * Items of the backend's `missing` list that a step other than basics fixes ("What a product
 * needs"). Anything else (a category, HSN code or GST rate that was switched off) is fixed in
 * basics.
 */
export enum MissingItem {
  Attributes = 'attributes',
  Variant = 'variant',
  Image = 'image',
}

/** The parts a product is always checked on, in the order the review step lists them. */
export const ALWAYS_CHECKED: readonly MissingItem[] = [
  MissingItem.Attributes,
  MissingItem.Variant,
  MissingItem.Image,
];

/** Which step fixes each item of the backend's `missing` list. */
export function productStepFor(missingItem: string): ProductStep {
  if (missingItem === MissingItem.Attributes) return ProductStep.Attributes;
  if (missingItem === MissingItem.Variant) return ProductStep.Variants;
  if (missingItem === MissingItem.Image) return ProductStep.Photos;
  return ProductStep.Basics;
}

/**
 * The step to show: the one in the address, or else the step that fixes the first missing item,
 * or else the review.
 */
export function productStepToShow(
  askedStep: string | null,
  missing: readonly string[],
): ProductStep {
  if (isProductStep(askedStep)) return askedStep;
  const firstMissing = missing[0];
  if (firstMissing) return productStepFor(firstMissing);
  return ProductStep.Review;
}

/**
 * Content, variants' codes and photos change directly only in these statuses
 * (area-3b-products.md, "How a product moves").
 */
export function canEditProduct(status: ProductStatus): boolean {
  return (
    status === ProductStatus.Draft ||
    status === ProductStatus.Rejected ||
    status === ProductStatus.Unpublished
  );
}

// ---- Small rules the screens share ----

/** A category of the dictionaries with its path ("Women › Kurtas"). */
export type CategoryChoice = { category: DictionaryCategory; path: string };

/** Every category of the tree with its path, in display order. */
export function flattenCategories(
  nodes: readonly DictionaryCategory[],
  parents: string[] = [],
): CategoryChoice[] {
  return nodes.flatMap((node) => {
    const names = [...parents, node.name];
    return [
      { category: node, path: names.join(' › ') },
      ...flattenCategories(node.children, names),
    ];
  });
}

/** One category of the dictionaries, with its path; undefined when it is no longer offered. */
export function findCategoryChoice(
  categories: readonly DictionaryCategory[],
  categoryId: string,
): CategoryChoice | undefined {
  return flattenCategories(categories).find((choice) => choice.category.id === categoryId);
}

/** The label of a size or colour code; the code itself when it is no longer offered. */
export function dictionaryLabel(entries: readonly DictionaryEntry[], code: string | null): string {
  if (!code) return '—';
  return entries.find((entry) => entry.code === code)?.label ?? code;
}

/** The main photo first, then the vendor's order. */
export function sortedPhotos(photos: readonly Photo[]): Photo[] {
  return [...photos].sort(
    (first, second) =>
      Number(second.isCover) - Number(first.isCover) ||
      (first.sortOrder ?? 0) - (second.sortOrder ?? 0),
  );
}

/**
 * Rupees as typed ("1499" or "1,499.50") to whole paise, without floating point (D-15; Document 3,
 * section 7).
 */
export function rupeesToPaise(value: string): number | null {
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(value.trim().replace(/,/g, ''));
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

/** Paise back to rupees for a form field: "1499" or "1499.50". */
export function paiseToRupees(paise: number): string {
  const rupees = Math.trunc(paise / 100);
  const remainingPaise = paise % 100;
  if (remainingPaise === 0) return String(rupees);
  return `${rupees}.${String(remainingPaise).padStart(2, '0')}`;
}

// ---- The product forms. Only cheap, certain checks; the backend decides the rest. ----

const trimmedText = z.string().trim();

export const BasicsFormSchema = z
  .object({
    title: trimmedText.min(1, 'validation.required'),
    categoryId: z.string().min(1, 'validation.choose'),
    brandId: z.string(),
    description: trimmedText,
    hsnCode: z.string(),
    gstRateBps: z.string(),
  })
  // The backend takes an own tax classification only as a pair (area-3b-products.md, POST
  // /vendors/me/products).
  .refine((values) => (values.hsnCode === '') === (values.gstRateBps === ''), {
    path: ['gstRateBps'],
    message: 'validation.taxPair',
  });
export type BasicsFormInput = z.input<typeof BasicsFormSchema>;
export type BasicsFormValues = z.output<typeof BasicsFormSchema>;

/** The attributes form: one text field per attribute of the category, by its key. */
export type AttributesFormValues = Record<string, string>;

const NUMBER_TEXT = /^(-?\d+(\.\d+)?)?$/;

export function attributesFormSchema(
  attributes: readonly Attribute[],
): z.ZodType<AttributesFormValues, AttributesFormValues> {
  const fields: Record<string, z.ZodString> = {};
  for (const attribute of attributes) {
    fields[attribute.key] =
      attribute.type === AttributeType.Number
        ? trimmedText.regex(NUMBER_TEXT, 'validation.number')
        : trimmedText;
  }
  return z.object(fields);
}

/** An amount in rupees, checked and turned into whole paise (D-15): the variant form and a sale. */
export const rupeesAsPaise = trimmedText
  .min(1, 'validation.required')
  .transform((rupees, context) => {
    const paise = rupeesToPaise(rupees);
    if (paise === null) {
      context.issues.push({ code: 'custom', message: 'validation.moneyShape', input: rupees });
      return z.NEVER;
    }
    return paise;
  });

/** The variant form. The two prices are typed in rupees; the checked values hold paise. */
export const VariantFormSchema = z.object({
  sizeCode: z.string(),
  colourCode: z.string(),
  sku: trimmedText.min(1, 'validation.required'),
  mrp: rupeesAsPaise,
  price: rupeesAsPaise,
});
export type VariantFormInput = z.input<typeof VariantFormSchema>;
export type VariantFormValues = z.output<typeof VariantFormSchema>;

// ---- Photo uploads ----

export enum UploadState {
  Waiting = 'waiting',
  Sending = 'sending',
  Failed = 'failed',
  /** The answer was lost: the photo may or may not have arrived. */
  Unknown = 'unknown',
}

/** One photo the vendor chose, while it waits, is sent, or has failed. */
export interface PhotoUpload {
  key: number;
  file: File;
  progress: number;
  state: UploadState;
  error?: AppError;
}
