import type { NextRequest } from 'next/server';
import { answerPublic } from '@/middleware/endpoint';
import { pageNumber } from '@/utils/url';
import * as productListApi from '@/features/storefront/product-list/server/product-list-api';

/**
 * GET /api/catalogue/brands: a page of the active brands (area-3a-catalogue.md), for the home
 * page's brand entries when they must be read again; fresh for 10 minutes (Document 7, section 12).
 */
export const dynamic = 'force-dynamic';

const FRESH_SECONDS = 600;
/** The backend gives at most 100 brands a page. */
const MAX_LIMIT = 100;

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = pageNumber(params.get('page'));
  const limit = Math.min(pageNumber(params.get('limit'), MAX_LIMIT), MAX_LIMIT);
  return answerPublic(() => productListApi.listBrands(page, limit), FRESH_SECONDS);
}
