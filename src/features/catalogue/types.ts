import { z } from 'zod';
import { pageOf } from '@/types/common';

/**
 * Backend Area 3a, the admin catalogue lists: response shapes written by hand from the API reference (D3-01), and the
 * forms. Source: Meanimehu/Ecommerce docs/api/reference/area-3a-catalogue.md, sections 2 to 6 ("Admin").
 * Rules of every list: nothing is deleted, a value is switched off with isActive; codes never change.
 */
const listItem = { id: z.string(), isActive: z.boolean() };

export const GstRateSchema = z.object({ ...listItem, rateBps: z.number().int(), label: z.string() });
export const HsnCodeSchema = z.object({ ...listItem, code: z.string(), description: z.string(), defaultGstRateBps: z.number().int().nullable() });
export const BrandSchema = z.object({ ...listItem, name: z.string(), slug: z.string() });
export const SizeSchema = z.object({ ...listItem, code: z.string(), label: z.string(), sizeGroup: z.string(), sortOrder: z.number().int() });
export const ColourSchema = z.object({ ...listItem, code: z.string(), label: z.string(), hex: z.string().nullable() });

/** Attribute definition: an element of a category's attributeSchema (section 4). */
export const ATTRIBUTE_TYPES = ['text', 'number', 'choice'] as const;
export const AttributeSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(ATTRIBUTE_TYPES),
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

/** The lists, by the name in their address (the backend's own path segment). */
export const CATALOGUE_LISTS = {
  'gst-rates': pageOf(GstRateSchema),
  'hsn-codes': pageOf(HsnCodeSchema),
  brands: pageOf(BrandSchema),
  sizes: pageOf(SizeSchema),
  colours: pageOf(ColourSchema),
  categories: z.object({ items: z.array(CategorySchema) }),
} as const;
export type CatalogueList = keyof typeof CATALOGUE_LISTS;

export const CATALOGUE_ITEMS = {
  'gst-rates': GstRateSchema,
  'hsn-codes': HsnCodeSchema,
  brands: BrandSchema,
  sizes: SizeSchema,
  colours: ColourSchema,
  categories: CategorySchema,
} as const;

/** The lists these screens change (Slice 2, Document 8). GST rates are only read here; their own screen is Slice 5. */
export const EDITABLE_LISTS = ['categories', 'hsn-codes', 'brands', 'sizes', 'colours'] as const;
export type EditableList = (typeof EDITABLE_LISTS)[number];
export const isEditableList = (value: string): value is EditableList => (EDITABLE_LISTS as readonly string[]).includes(value);
export const isCatalogueList = (value: string): value is CatalogueList => value in CATALOGUE_LISTS;

export const SIZE_GROUPS = ['apparel', 'footwear', 'other'] as const;

// ---- Forms. Only cheap, certain checks; the backend's rules (key shapes, uniqueness, limits) are its own. ----

const text = z.string().trim();
const required = text.min(1, 'validation.required');
const wholeNumber = text.regex(/^\d*$/, 'validation.wholeNumber');

export const HsnFormSchema = z.object({ code: required, description: required, defaultGstRateBps: z.string() });
export const BrandFormSchema = z.object({ name: required, slug: text });
export const SizeFormSchema = z.object({ code: required, label: required, sizeGroup: z.string().min(1, 'validation.choose'), sortOrder: wholeNumber });
export const ColourFormSchema = z.object({ code: required, label: required, hex: text.regex(/^(#[0-9a-fA-F]{6})?$/, 'validation.hexShape') });

export const AttributeFormSchema = z.object({
  key: required,
  label: required,
  type: z.enum(ATTRIBUTE_TYPES),
  required: z.boolean(),
  options: z.string(),
  filterable: z.boolean(),
});
export const CategoryFormSchema = z.object({
  name: required,
  parentId: z.string(),
  slug: text,
  defaultHsnCode: z.string(),
  defaultGstRateBps: z.string(),
  sortOrder: wholeNumber,
  attributes: z.array(AttributeFormSchema),
});
export type CategoryFormInput = z.input<typeof CategoryFormSchema>;
export type AttributeFormInput = z.input<typeof AttributeFormSchema>;

/** One attribute as the backend takes it: options and filterable only for a choice (section 4). */
export function attributeBody(row: AttributeFormInput): Attribute {
  const base = { key: row.key.trim(), label: row.label.trim(), type: row.type, required: row.required };
  if (row.type !== 'choice') return base;
  const options = row.options
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean);
  return { ...base, options, filterable: row.filterable };
}

/** Categories in tree order: each parent followed by its own sub-categories (by sortOrder, then name). */
export function inTreeOrder(categories: readonly Category[]): Category[] {
  const children = new Map<string | null, Category[]>();
  const ids = new Set(categories.map((c) => c.id));
  for (const category of categories) {
    // A parent missing from the list: show the category at the top level rather than lose it.
    const parent = category.parentId && ids.has(category.parentId) ? category.parentId : null;
    children.set(parent, [...(children.get(parent) ?? []), category]);
  }
  const ordered: Category[] = [];
  const visit = (parent: string | null) => {
    const list = [...(children.get(parent) ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    for (const category of list) {
      ordered.push(category);
      visit(category.id);
    }
  };
  visit(null);
  return ordered;
}
