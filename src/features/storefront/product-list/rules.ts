import type { CategoryNode } from './types';

/**
 * The small rules of the product lists. This file has no Zod and imports only types, so a public
 * page that uses a rule does not load Zod (about 31 KB) into the browser (Document 7, section 16).
 * The answer schemas stay in `types.ts`, used by the server.
 */

/** How a list orders its products: the backend's `sort` values (area-3a-catalogue.md, product list). */
export enum ProductSort {
  Newest = 'newest',
  PriceLowToHigh = 'price_asc',
  PriceHighToLow = 'price_desc',
  /** Only with search text: the backend's best match. */
  BestMatch = 'relevance',
}

/** The orders a category or brand list offers; search results add the best match first. */
export const LIST_SORTS = [
  ProductSort.Newest,
  ProductSort.PriceLowToHigh,
  ProductSort.PriceHighToLow,
] as const;

// ---- Filters (Document 5, section 6.1; Document 6, 8.8) ----

/** The names of the filters and the sort in a list page's address, such as ?size=M,L&sort=price_asc. */
export enum ListParam {
  Size = 'size',
  Colour = 'colour',
  Brand = 'brand',
  MinPrice = 'minPrice',
  MaxPrice = 'maxPrice',
  Sort = 'sort',
}

/** The filter groups whose values are a list of choices. */
export enum FilterGroup {
  Size = 'size',
  Colour = 'colour',
  Brand = 'brand',
}

/** The backend takes at most 20 filter values in one request (sizes, colours and brands together). */
export const MAX_FILTER_VALUES = 20;

/** The highest price the backend accepts, in whole rupees (100,000,000 paise). */
const MAX_PRICE_RUPEES = 1_000_000;

const PAISE_PER_RUPEE = 100;

/** What a list is filtered and ordered by. Prices are whole rupees; null is no limit. */
export interface ListFilters {
  sizes: string[];
  colours: string[];
  brandIds: string[];
  minRupees: number | null;
  maxRupees: number | null;
  /** Null is the list's own default (newest, or the best match for a search). */
  sort: ProductSort | null;
}

export const NO_FILTERS: ListFilters = {
  sizes: [],
  colours: [],
  brandIds: [],
  minRupees: null,
  maxRupees: null,
  sort: null,
};

/** Values in one fixed order, each once, so equal choices give the same address (Document 4, section 7). */
const tidy = (values: readonly string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();

const listOf = (value: string | string[] | undefined) =>
  tidy((Array.isArray(value) ? value.join(',') : (value ?? '')).split(','));

function rupeesOf(value: string | string[] | undefined): number | null {
  const text = Array.isArray(value) ? value[0] : value;
  if (!text || !/^\d+$/.test(text)) return null;
  const rupees = Number(text);
  return rupees <= MAX_PRICE_RUPEES ? rupees : null;
}

function sortOf(value: string | string[] | undefined): ProductSort | null {
  const text = Array.isArray(value) ? value[0] : value;
  return Object.values(ProductSort).find((sort) => sort === text) ?? null;
}

/**
 * The filters in a list page's address. Anything that is not a valid value is left out, and past
 * 20 filter values the rest are dropped, so the backend never refuses the request. A lowest price
 * above the highest is swapped.
 */
export function readListFilters(
  params: Record<string, string | string[] | undefined>,
): ListFilters {
  let budget = MAX_FILTER_VALUES;
  const within = (values: string[]) => {
    const kept = values.slice(0, budget);
    budget -= kept.length;
    return kept;
  };
  const sizes = within(listOf(params[ListParam.Size]));
  const colours = within(listOf(params[ListParam.Colour]));
  const brandIds = within(listOf(params[ListParam.Brand]));
  const lowest = rupeesOf(params[ListParam.MinPrice]);
  const highest = rupeesOf(params[ListParam.MaxPrice]);
  const isSwapped = lowest !== null && highest !== null && lowest > highest;
  return {
    sizes,
    colours,
    brandIds,
    minRupees: isSwapped ? highest : lowest,
    maxRupees: isSwapped ? lowest : highest,
    sort: sortOf(params[ListParam.Sort]),
  };
}

/** The filters as a page's query values, for `withQuery`. */
export function listSearch(filters: ListFilters): Record<string, string | number | null> {
  return {
    [ListParam.Size]: filters.sizes.join(','),
    [ListParam.Colour]: filters.colours.join(','),
    [ListParam.Brand]: filters.brandIds.join(','),
    [ListParam.MinPrice]: filters.minRupees,
    [ListParam.MaxPrice]: filters.maxRupees,
    [ListParam.Sort]: filters.sort,
  };
}

/** The filters as the backend's product list takes them: comma lists, prices in paise. */
export function backendFilters(filters: ListFilters): Record<string, string | number | null> {
  return {
    size: filters.sizes.join(','),
    colour: filters.colours.join(','),
    brandId: filters.brandIds.join(','),
    minPrice: filters.minRupees === null ? null : filters.minRupees * PAISE_PER_RUPEE,
    maxPrice: filters.maxRupees === null ? null : filters.maxRupees * PAISE_PER_RUPEE,
    sort: filters.sort,
  };
}

/** The values chosen in one group. */
export const chosenValues = (filters: ListFilters, group: FilterGroup): string[] =>
  ({
    [FilterGroup.Size]: filters.sizes,
    [FilterGroup.Colour]: filters.colours,
    [FilterGroup.Brand]: filters.brandIds,
  })[group];

const groupKey = {
  [FilterGroup.Size]: 'sizes',
  [FilterGroup.Colour]: 'colours',
  [FilterGroup.Brand]: 'brandIds',
} as const;

export const isChosen = (filters: ListFilters, group: FilterGroup, value: string) =>
  chosenValues(filters, group).includes(value);

/** The filters with one value of a group switched on or off. */
export function withToggled(filters: ListFilters, group: FilterGroup, value: string): ListFilters {
  const values = chosenValues(filters, group);
  const next = values.includes(value)
    ? values.filter((chosen) => chosen !== value)
    : tidy([...values, value]);
  return { ...filters, [groupKey[group]]: next };
}

/** How many filters are on (a price range counts once), for "Filters · 2". */
export function activeFilterCount(filters: ListFilters): number {
  const hasPrice = filters.minRupees !== null || filters.maxRupees !== null;
  return (
    filters.sizes.length + filters.colours.length + filters.brandIds.length + (hasPrice ? 1 : 0)
  );
}

/** The same order, with every filter off. */
export const withoutFilters = (filters: ListFilters): ListFilters => ({
  ...NO_FILTERS,
  sort: filters.sort,
});

/** Whether the address holds any filter or order: such a page is not indexed (Document 4, D4-04). */
export const isPlainList = (filters: ListFilters) =>
  activeFilterCount(filters) === 0 && filters.sort === null;

// ---- Where a category sits ----

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
 * The categories the home page offers (Document 6, 7.4): the second level of the tree (such as
 * Kurtas under Women), or a top-level category that has none below it, each only when it has
 * products, in the tree's order.
 */
export function categoryEntries(nodes: readonly CategoryNode[]): CategoryNode[] {
  return nodes
    .flatMap((node) => (node.children.length ? node.children : [node]))
    .filter((node) => node.productCount > 0);
}
