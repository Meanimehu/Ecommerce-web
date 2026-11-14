import { z } from 'zod';
import { pageOf } from '@/types/common';

/**
 * Backend Area 3a, the storefront part: the public category tree, product cards and one product,
 * written by hand from the API reference (D3-01), and the small rules the storefront screens share.
 * Source: Meanimehu/Ecommerce docs/api/reference/area-3a-catalogue.md, section 1 (no login; the
 * answer is the same for everyone). Prices are whole paise, GST included.
 */

/** How the category page orders its products. Filters and other orders come in Slice 3. */
export enum ProductSort {
  Newest = 'newest',
}

// ---- What the backend sends ----

/** GET /catalogue/categories: the active categories, nested in display order. */
export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children: CategoryNode[];
};
export const CategoryNodeSchema: z.ZodType<CategoryNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    productCount: z.number().int(),
    children: z.array(CategoryNodeSchema),
  }),
);
export const CategoryTreeSchema = z.object({ items: z.array(CategoryNodeSchema) });
export type CategoryTree = z.infer<typeof CategoryTreeSchema>;

/** A product card (GET /catalogue/products, each item). */
export const ProductCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  brand: z.object({ id: z.string(), name: z.string(), slug: z.string() }).nullable(),
  vendor: z.object({ id: z.string(), displayName: z.string() }),
  pricePaise: z.number().int(),
  mrpPaise: z.number().int(),
  discountPercent: z.number().int(),
  coverUrl: z.string().nullable(),
  thumbUrl: z.string().nullable(),
  inStock: z.boolean(),
  onSale: z.boolean(),
  saleEndsAt: z.string().nullable(),
});
export type ProductCardData = z.infer<typeof ProductCardSchema>;
export const ProductCardPageSchema = pageOf(ProductCardSchema);

/** GET /catalogue/products/{id}: one visible product. */
export const PublicVariantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  size: z.object({ code: z.string(), label: z.string() }).nullable(),
  colour: z.object({ code: z.string(), label: z.string(), hex: z.string().nullable() }).nullable(),
  pricePaise: z.number().int(),
  mrpPaise: z.number().int(),
  discountPercent: z.number().int(),
  inStock: z.boolean(),
  lowStock: z.boolean(),
  onSale: z.boolean(),
  saleEndsAt: z.string().nullable(),
});
export type PublicVariant = z.infer<typeof PublicVariantSchema>;
export type VariantSize = NonNullable<PublicVariant['size']>;
export type VariantColour = NonNullable<PublicVariant['colour']>;

const CategoryCrumbSchema = z.object({ id: z.string(), name: z.string(), slug: z.string() });
export type CategoryCrumb = z.infer<typeof CategoryCrumbSchema>;

export const ProductDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  brand: z.object({ id: z.string(), name: z.string(), slug: z.string() }).nullable(),
  vendor: z.object({ id: z.string(), displayName: z.string() }),
  category: CategoryCrumbSchema,
  categoryPath: z.array(CategoryCrumbSchema),
  attributes: z.array(
    z.object({ key: z.string(), label: z.string(), value: z.union([z.string(), z.number()]) }),
  ),
  pricePaise: z.number().int(),
  mrpPaise: z.number().int(),
  discountPercent: z.number().int(),
  images: z.array(
    z.object({
      altText: z.string().nullable(),
      urls: z.object({ large: z.string(), medium: z.string(), thumb: z.string() }),
    }),
  ),
  variants: z.array(PublicVariantSchema),
  inStock: z.boolean(),
  lowStock: z.boolean(),
  onSale: z.boolean(),
  saleEndsAt: z.string().nullable(),
});
export type ProductDetail = z.infer<typeof ProductDetailSchema>;
export type ProductImage = ProductDetail['images'][number];

// ---- Small rules the storefront shares ----

/** The node with this id or slug, and the path from the top level down to it. */
export function findInTree(
  nodes: readonly CategoryNode[],
  isWanted: (node: CategoryNode) => boolean,
  parents: CategoryNode[] = [],
): CategoryNode[] | null {
  for (const node of nodes) {
    if (isWanted(node)) return [...parents, node];
    const found = findInTree(node.children, isWanted, [...parents, node]);
    if (found) return found;
  }
  return null;
}

/**
 * The categories above a product, for its breadcrumbs: the backend's path, and the product's own
 * category at the end when the path does not already hold it.
 */
export function categoryTrail(product: ProductDetail): CategoryCrumb[] {
  const isCategoryInPath = product.categoryPath.some((crumb) => crumb.id === product.category.id);
  return isCategoryInPath ? product.categoryPath : [...product.categoryPath, product.category];
}

/** How much of something is left, as the backend says it. */
export enum StockLevel {
  InStock = 'inStock',
  Low = 'low',
  Out = 'out',
}

export function stockLevelOf(item: { inStock: boolean; lowStock: boolean }): StockLevel {
  if (!item.inStock) return StockLevel.Out;
  return item.lowStock ? StockLevel.Low : StockLevel.InStock;
}

// ---- Choosing a variant (Document 5, section 6.2) ----

/** Each size or colour once, in the order the variants give them. */
export function distinctByCode<Option extends { code: string }>(options: Option[]): Option[] {
  return [...new Map(options.map((option) => [option.code, option])).values()];
}

export function sizesOf(variants: readonly PublicVariant[]): VariantSize[] {
  return distinctByCode(variants.flatMap((variant) => (variant.size ? [variant.size] : [])));
}

export function coloursOf(variants: readonly PublicVariant[]): VariantColour[] {
  return distinctByCode(variants.flatMap((variant) => (variant.colour ? [variant.colour] : [])));
}

/** A size and colour chosen so far; null is not chosen yet. */
export interface VariantChoice {
  sizeCode: string | null;
  colourCode: string | null;
}

/**
 * The variant this choice points at. A product without sizes or colours needs no choice of that
 * kind; until every needed choice is made there is none.
 */
export function chosenVariant(
  variants: readonly PublicVariant[],
  { sizeCode, colourCode }: VariantChoice,
): PublicVariant | null {
  const wantedSize = sizesOf(variants).length ? sizeCode : null;
  const wantedColour = coloursOf(variants).length ? colourCode : null;
  return (
    variants.find(
      (variant) =>
        (variant.size?.code ?? null) === wantedSize &&
        (variant.colour?.code ?? null) === wantedColour,
    ) ?? null
  );
}

/**
 * Whether any variant in stock has this size and this colour; null leaves that choice open. A size
 * or colour that is not available is crossed out and cannot be chosen.
 */
export function isAvailable(
  variants: readonly PublicVariant[],
  { sizeCode, colourCode }: VariantChoice,
) {
  return variants.some(
    (variant) =>
      variant.inStock &&
      (sizeCode === null || variant.size?.code === sizeCode) &&
      (colourCode === null || variant.colour?.code === colourCode),
  );
}

/** What the person still has to choose before adding to the cart. */
export enum MissingChoice {
  SizeAndColour = 'sizeAndColour',
  Size = 'size',
  Colour = 'colour',
}

export function missingChoiceOf(
  variants: readonly PublicVariant[],
  choice: VariantChoice,
): MissingChoice | null {
  if (chosenVariant(variants, choice)) return null;
  const needsSize = sizesOf(variants).length > 0 && choice.sizeCode === null;
  const needsColour = coloursOf(variants).length > 0 && choice.colourCode === null;
  if (needsSize && needsColour) return MissingChoice.SizeAndColour;
  if (needsSize) return MissingChoice.Size;
  return MissingChoice.Colour;
}

// ---- Adding to the cart ----

export enum AddMessageTone {
  Success = 'success',
  Warning = 'warning',
}

/** What the product page says after "Add to cart": added, or the answer was lost. */
export interface AddMessage {
  tone: AddMessageTone;
  text: string;
}
