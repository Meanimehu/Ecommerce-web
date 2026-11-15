import type { NextRequest } from 'next/server';
import { answerPublic } from '@/middleware/endpoint';
import { pick } from '@/utils/url';
import * as productListApi from '@/features/storefront/product-list/server/product-list-api';

/**
 * GET /api/catalogue/products: product cards for "Load more" (area-3a-catalogue.md); fresh for 60
 * seconds (Document 7, section 12).
 */
export const dynamic = 'force-dynamic';

const FRESH_SECONDS = 60;
const QUERY_NAMES = [
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

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, QUERY_NAMES);
  return answerPublic(() => productListApi.listProducts(query), FRESH_SECONDS);
}
