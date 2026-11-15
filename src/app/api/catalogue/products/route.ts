import type { NextRequest } from 'next/server';
import { answerPublic } from '@/middleware/endpoint';
import { pick } from '@/utils/url';
import * as productListApi from '@/features/storefront/product-list/server/product-list-api';

/**
 * GET /api/catalogue/products: product cards for "Load more" and the home page (area-3a-catalogue.md);
 * fresh for 60 seconds, search results for 30 (Document 7, section 12).
 */
export const dynamic = 'force-dynamic';

const FRESH_SECONDS = 60;
const QUERY_NAMES = [
  'q',
  'categorySlug',
  'categoryId',
  'size',
  'colour',
  'brandId',
  'minPrice',
  'maxPrice',
  'sort',
  'page',
  'limit',
];

/** Search results are fresher (Document 7, section 12). */
const SEARCH_FRESH_SECONDS = 30;

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, QUERY_NAMES);
  return answerPublic(
    () => productListApi.listProducts(query),
    query.q ? SEARCH_FRESH_SECONDS : FRESH_SECONDS,
  );
}
