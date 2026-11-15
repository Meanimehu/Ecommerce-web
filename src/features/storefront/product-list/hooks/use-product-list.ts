'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { get } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import type { CategoryTree, ProductCardData } from '@/features/storefront/product-list/types';

/**
 * The calls of `product-list`, one hook per call, to our own /api/catalogue endpoints (D3-03). The
 * pages arrive drawn on the server; these read again in the browser only what must be current.
 */
const CATEGORY_TREE_PATH = '/api/catalogue/categories';
const PRODUCT_CARDS_PATH = '/api/catalogue/products';

/** The category tree changes rarely: our endpoint keeps it for 10 minutes too. */
const CATEGORY_TREE_STALE_MS = 600_000;

export const productListKeys = {
  categoryTree: ['catalogue', 'tree'] as const,
  productCards: (query: Query) => ['storefront', 'products', query] as const,
};

/** The public category tree; `product`'s moderation screens use it too (Document 7, 20.4). */
export const useCategoryTree = () =>
  useQuery({
    queryKey: productListKeys.categoryTree,
    queryFn: () => get<CategoryTree>(CATEGORY_TREE_PATH),
    staleTime: CATEGORY_TREE_STALE_MS,
  });

/**
 * The product cards of a list, batch by batch ("Load more"). The first batch is the one the server
 * drew; each further one is read only when asked for. Nothing is kept once the page closes, so
 * opening the page again starts from its first batch.
 */
export const useProductCards = (firstBatch: Page<ProductCardData>, query: Query) =>
  useInfiniteQuery({
    queryKey: productListKeys.productCards(query),
    queryFn: ({ pageParam }) =>
      get<Page<ProductCardData>>(
        withQuery(PRODUCT_CARDS_PATH, { ...query, page: pageParam, limit: firstBatch.limit }),
      ),
    initialPageParam: firstBatch.page,
    initialData: { pages: [firstBatch], pageParams: [firstBatch.page] },
    getNextPageParam: (lastBatch) => lastBatch.page + 1,
    staleTime: Infinity,
    gcTime: 0,
  });
