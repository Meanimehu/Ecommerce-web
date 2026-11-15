import 'server-only';
import { callBackend, type CallResult } from '@/api/client';
import { boundedCache } from '@/utils/bounded-cache';
import { withQuery, type Query } from '@/utils/url';
import {
  CategoryTreeSchema,
  ProductListSchema,
  type ProductList,
} from '@/features/storefront/product-list/types';

/**
 * Backend Area 3a, the lists a customer sees (area-3a-catalogue.md, section 1): no login, and the
 * answer is the same for everyone.
 */

/** Public list answers kept on our server: 60 seconds, at most 2,000 (Document 7, section 12). */
const LIST_CACHE_LIFE_MS = 60_000;
const CACHE_MAX_ENTRIES = 2_000;

const listCache = boundedCache<CallResult<ProductList>>({
  lifeMs: LIST_CACHE_LIFE_MS,
  maxEntries: CACHE_MAX_ENTRIES,
});

export const getCategoryTree = () =>
  callBackend({
    method: 'GET',
    path: '/catalogue/categories',
    kind: 'view',
    schema: CategoryTreeSchema,
  });

/**
 * One batch of a product list with its filter counts. Kept for a minute under a key made of every
 * value in one fixed order (`withQuery` sorts the names; the filter values are sorted already), so
 * equal requests share one answer and a page that reads its filters does not call the backend each
 * time (Document 4, section 7; Document 8, Slice 3 notes).
 */
export const listProducts = (query: Query) =>
  listCache(withQuery('/catalogue/products', query), () =>
    callBackend({
      method: 'GET',
      path: '/catalogue/products',
      query,
      kind: 'view',
      schema: ProductListSchema,
    }),
  );
