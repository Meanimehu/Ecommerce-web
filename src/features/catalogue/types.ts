import { z } from 'zod';
import { pageOf } from '@/types/common';
import type { components } from '@/types/generated/backend-api';

/**
 * Backend Area 3a, the admin catalogue lists: response shapes written by hand from the API
 * reference (D3-01), and the forms. Source: Meanimehu/Ecommerce
 * docs/api/reference/area-3a-catalogue.md, sections 2 to 6 ("Admin"). Rules of every list: nothing
 * is deleted, a value is switched off with isActive; codes never change.
 */

/** The lists, by the name in their address: the backend's own path segment. */
export enum CatalogueList {
  GstRates = 'gst-rates',
  HsnCodes = 'hsn-codes',
  Categories = 'categories',
  Brands = 'brands',
  Sizes = 'sizes',
  Colours = 'colours',
}

export enum AttributeType {
  Text = 'text',
  Number = 'number',
  Choice = 'choice',
}

export enum SizeGroup {
  Apparel = 'apparel',
  Footwear = 'footwear',
  Other = 'other',
}

export const ATTRIBUTE_TYPES: readonly AttributeType[] = Object.values(AttributeType);
export const SIZE_GROUPS: readonly SizeGroup[] = Object.values(SizeGroup);

export function isSizeGroup(value: string): value is SizeGroup {
  return (SIZE_GROUPS as readonly string[]).includes(value);
}

/** A category can be up to 4 levels deep, so only a category above level 4 can be a parent. */
export const MAX_CATEGORY_DEPTH = 4;

const listItem = { id: z.string(), isActive: z.boolean() };

export const GstRateSchema = z.object({
  ...listItem,
  rateBps: z.number().int(),
  label: z.string(),
});
export const HsnCodeSchema = z.object({
  ...listItem,
  code: z.string(),
  description: z.string(),
  defaultGstRateBps: z.number().int().nullable(),
});
export const BrandSchema = z.object({ ...listItem, name: z.string(), slug: z.string() });
export const SizeSchema = z.object({
  ...listItem,
  code: z.string(),
  label: z.string(),
  sizeGroup: z.string(),
  sortOrder: z.number().int(),
});
export const ColourSchema = z.object({
  ...listItem,
  code: z.string(),
  label: z.string(),
  hex: z.string().nullable(),
});

/** Attribute definition: an element of a category's attributeSchema (section 4). */
export const AttributeSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(AttributeType),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  filterable: z.boolean().optional(),
});
export type Attribute = z.infer<typeof AttributeSchema>;

export const CategorySchema = z.object({
  ...listItem,
  parentId: z.string().nullable(),
  name: z.string(),
  slug: z.string(),
  depth: z.number().int(),
  attributeSchema: z.array(AttributeSchema),
  defaultHsnCode: z.string().nullable(),
  defaultGstRateBps: z.number().int().nullable(),
  sortOrder: z.number().int(),
});

export type GstRate = z.infer<typeof GstRateSchema>;
export type HsnCode = z.infer<typeof HsnCodeSchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type Size = z.infer<typeof SizeSchema>;
export type Colour = z.infer<typeof ColourSchema>;
export type Category = z.infer<typeof CategorySchema>;

export const CATALOGUE_LISTS = {
  [CatalogueList.GstRates]: pageOf(GstRateSchema),
  [CatalogueList.HsnCodes]: pageOf(HsnCodeSchema),
  [CatalogueList.Brands]: pageOf(BrandSchema),
  [CatalogueList.Sizes]: pageOf(SizeSchema),
  [CatalogueList.Colours]: pageOf(ColourSchema),
  [CatalogueList.Categories]: z.object({ items: z.array(CategorySchema) }),
} as const;

export const CATALOGUE_ITEMS = {
  [CatalogueList.GstRates]: GstRateSchema,
  [CatalogueList.HsnCodes]: HsnCodeSchema,
  [CatalogueList.Brands]: BrandSchema,
  [CatalogueList.Sizes]: SizeSchema,
  [CatalogueList.Colours]: ColourSchema,
  [CatalogueList.Categories]: CategorySchema,
} as const;

/**
 * The lists these screens change (Slice 2 and, for GST rates, Slice 5; Document 8), in the order of
 * their tabs.
 */
export type EditableList = CatalogueList;
export const EDITABLE_LISTS: readonly EditableList[] = [
  CatalogueList.Categories,
  CatalogueList.HsnCodes,
  CatalogueList.GstRates,
  CatalogueList.Brands,
  CatalogueList.Sizes,
  CatalogueList.Colours,
];

export function isCatalogueList(value: string): value is CatalogueList {
  return (Object.values(CatalogueList) as string[]).includes(value);
}

export function isEditableList(value: string): value is EditableList {
  return (EDITABLE_LISTS as readonly string[]).includes(value);
}

/** A rate in basis points as a select's value: empty when there is none. */
export function rateField(rateBps: number | null | undefined): string {
  return rateBps === null || rateBps === undefined ? '' : String(rateBps);
}

/** A select's value as a rate in basis points: none when empty. */
export function rateValue(field: string): number | null {
  return field === '' ? null : Number(field);
}

// ---- Request bodies, from the generated backend types (D7-02). The backend checks every field.
// ----

type Schemas = components['schemas'];

/**
 * The generated type cannot describe one attribute (the backend's description gives no shape for
 * it), so a category's attribute list uses ours.
 */
type WithAttributes<Body> = Omit<Body, 'attributeSchema'> & { attributeSchema?: Attribute[] };

/** What adding to and changing each list sends. */
export interface CatalogueBodies {
  [CatalogueList.GstRates]: {
    add: Schemas['CreateGstRateDto'];
    change: Schemas['UpdateGstRateDto'];
  };
  [CatalogueList.HsnCodes]: {
    add: Schemas['CreateHsnCodeDto'];
    change: Schemas['UpdateHsnCodeDto'];
  };
  [CatalogueList.Categories]: {
    add: WithAttributes<Schemas['CreateCategoryDto']>;
    change: WithAttributes<Schemas['UpdateCategoryDto']>;
  };
  [CatalogueList.Brands]: { add: Schemas['CreateBrandDto']; change: Schemas['UpdateBrandDto'] };
  [CatalogueList.Sizes]: { add: Schemas['CreateSizeDto']; change: Schemas['UpdateSizeDto'] };
  [CatalogueList.Colours]: { add: Schemas['CreateColourDto']; change: Schemas['UpdateColourDto'] };
}

export type AddBody<List extends EditableList> = CatalogueBodies[List]['add'];
export type ChangeBody<List extends EditableList> = CatalogueBodies[List]['change'];

// ---- Forms. Only cheap, certain checks; the backend's rules (key shapes, uniqueness, limits) are
// its own. ----

const text = z.string().trim();
const requiredText = text.min(1, 'validation.required');
const WHOLE_NUMBER = /^\d*$/;
const HEX_COLOUR = /^(#[0-9a-fA-F]{6})?$/;
const wholeNumber = text.regex(WHOLE_NUMBER, 'validation.wholeNumber');

export const HsnCodeFormSchema = z.object({
  code: requiredText,
  description: requiredText,
  defaultGstRateBps: z.string(),
});
export type HsnCodeFormInput = z.input<typeof HsnCodeFormSchema>;
export type HsnCodeFormValues = z.output<typeof HsnCodeFormSchema>;

/** A percentage with at most two decimals, from 0 to 100, as the backend's rate (basis points, 0 to 10000). */
const PERCENT = /^(100(\.0{1,2})?|\d{1,2}(\.\d{1,2})?)$/;

export const GstRateFormSchema = z.object({
  rate: text.min(1, 'validation.required').regex(PERCENT, 'validation.percentShape'),
  label: text,
});
export type GstRateFormInput = z.input<typeof GstRateFormSchema>;
export type GstRateFormValues = z.output<typeof GstRateFormSchema>;

/** "5" or "12.5" per cent as basis points (500, 1250). */
export function percentToBps(percent: string): number {
  return Math.round(Number(percent) * 100);
}

export const BrandFormSchema = z.object({ name: requiredText, slug: text });
export type BrandFormInput = z.input<typeof BrandFormSchema>;
export type BrandFormValues = z.output<typeof BrandFormSchema>;

export const SizeFormSchema = z.object({
  code: requiredText,
  label: requiredText,
  sizeGroup: z.enum(SizeGroup, { error: 'validation.choose' }),
  sortOrder: wholeNumber,
});
export type SizeFormInput = z.input<typeof SizeFormSchema>;
export type SizeFormValues = z.output<typeof SizeFormSchema>;

export const ColourFormSchema = z.object({
  code: requiredText,
  label: requiredText,
  hex: text.regex(HEX_COLOUR, 'validation.hexShape'),
});
export type ColourFormInput = z.input<typeof ColourFormSchema>;
export type ColourFormValues = z.output<typeof ColourFormSchema>;

export const AttributeFormSchema = z.object({
  key: requiredText,
  label: requiredText,
  type: z.enum(AttributeType),
  required: z.boolean(),
  options: z.string(),
  filterable: z.boolean(),
});
export type AttributeFormInput = z.input<typeof AttributeFormSchema>;

export const CategoryFormSchema = z.object({
  name: requiredText,
  parentId: z.string(),
  slug: text,
  defaultHsnCode: z.string(),
  defaultGstRateBps: z.string(),
  sortOrder: wholeNumber,
  attributes: z.array(AttributeFormSchema),
});
export type CategoryFormInput = z.input<typeof CategoryFormSchema>;
export type CategoryFormValues = z.output<typeof CategoryFormSchema>;

/** One attribute as the backend takes it: options and filterable only for a choice (section 4). */
export function attributeBody(row: AttributeFormInput): Attribute {
  const base = {
    key: row.key.trim(),
    label: row.label.trim(),
    type: row.type,
    required: row.required,
  };
  if (row.type !== AttributeType.Choice) return base;
  const options = row.options
    .split('\n')
    .map((option) => option.trim())
    .filter(Boolean);
  return { ...base, options, filterable: row.filterable };
}

/**
 * Categories in tree order: each parent followed by its own sub-categories (by sortOrder, then
 * name).
 */
export function inTreeOrder(categories: readonly Category[]): Category[] {
  const childrenOf = new Map<string | null, Category[]>();
  const knownIds = new Set(categories.map((category) => category.id));
  for (const category of categories) {
    // A parent missing from the list: show the category at the top level rather than lose it.
    const parentId =
      category.parentId && knownIds.has(category.parentId) ? category.parentId : null;
    childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), category]);
  }
  const ordered: Category[] = [];
  const visit = (parentId: string | null) => {
    const children = [...(childrenOf.get(parentId) ?? [])].sort(
      (first, second) =>
        first.sortOrder - second.sortOrder || first.name.localeCompare(second.name),
    );
    for (const category of children) {
      ordered.push(category);
      visit(category.id);
    }
  };
  visit(null);
  return ordered;
}
