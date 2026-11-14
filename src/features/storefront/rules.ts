import type {
  CategoryCrumb,
  CategoryNode,
  ProductDetail,
  PublicVariant,
  VariantColour,
  VariantSize,
} from './types';

/**
 * The small rules the storefront's screens and hooks share. This file has no Zod and imports only
 * types, so a public page that uses a rule does not load Zod (about 31 KB) into the browser, as
 * `lib/add-notice.ts` does for the cart (Document 7, 20.9). The answer schemas stay in
 * `types.ts`, used by the server.
 */

/** How the category page orders its products. Filters and other orders come in Slice 3. */
export enum ProductSort {
  Newest = 'newest',
}

// ---- Where a category or product sits ----

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
