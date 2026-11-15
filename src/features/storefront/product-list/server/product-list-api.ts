import 'server-only';
import { callBackend, type CallResult } from '@/api/client';
import { boundedCache } from '@/utils/bounded-cache';
import { withQuery, type Query } from '@/utils/url';
import {
  BrandPageSchema,
  CategoryTreeSchema,
  ProductListSchema,
  type CategoryTree,
  type ProductList,
} from '@/features/storefront/product-list/types';

/**
 * Backend Area 3a, the lists a customer sees (area-3a-catalogue.md, section 1): no login, and the
 * answer is the same for everyone.
 */

/**
 * Public list answers kept on our server: lists 60 seconds, search results 30 seconds, at most
 * 2,000 of each (Document 7, section 12).
 */
const LIST_CACHE_LIFE_MS = 60_000;
const SEARCH_CACHE_LIFE_MS = 30_000;
const CACHE_MAX_ENTRIES = 2_000;
/** The category tree changes rarely: 10 minutes (Document 7, section 12). */
const TREE_CACHE_LIFE_MS = 600_000;
const TREE_KEY = 'tree';

const listCache = boundedCache<CallResult<ProductList>>({
  lifeMs: LIST_CACHE_LIFE_MS,
  maxEntries: CACHE_MAX_ENTRIES,
});
const searchCache = boundedCache<CallResult<ProductList>>({
  lifeMs: SEARCH_CACHE_LIFE_MS,
  maxEntries: CACHE_MAX_ENTRIES,
});
const treeCache = boundedCache<CallResult<CategoryTree>>({
  lifeMs: TREE_CACHE_LIFE_MS,
  maxEntries: 1,
});

/**
 * The public category tree, kept on our server for 10 minutes: the header shows its top level on
 * every page, and the category and home pages read it too.
 */
export const getCategoryTree = () =>
  treeCache(TREE_KEY, () =>
    callBackend({
      method: 'GET',
      path: '/catalogue/categories',
      kind: 'view',
      schema: CategoryTreeSchema,
    }),
  );

/** One page of the active brands, by name (`limit` 1 to 100). */
export const listBrands = (page: number, limit: number) =>
  callBackend({
    method: 'GET',
    path: '/catalogue/brands',
    query: { page, limit },
    kind: 'view',
    schema: BrandPageSchema,
  });

/**
 * One batch of a product list with its filter counts. Kept for a minute (search results for half a
 * minute) under a key made of every
 * value in one fixed order (`withQuery` sorts the names; the filter values are sorted already), so
 * equal requests share one answer and a page that reads its filters does not call the backend each
 * time (Document 4, section 7; Document 8, Slice 3 notes).
 */
export const listProducts = (query: Query) =>
  (query.q ? searchCache : listCache)(withQuery('/catalogue/products', query), () =>
    callBackend({
      method: 'GET',
      path: '/catalogue/products',
      query,
      kind: 'view',
      schema: ProductListSchema,
    }),
  );
