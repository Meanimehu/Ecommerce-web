import type { NextRequest } from 'next/server';
import * as catalogueApi from '@/api/catalogue';
import { answerPublic } from '@/middleware/endpoint';
import { pick } from '@/utils/url';

/** GET /api/catalogue/products: product cards for "Load more" (area-3a-catalogue.md); fresh for 60 seconds (Document 7, section 12). */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, ['categorySlug', 'categoryId', 'sort', 'page', 'limit']);
  return answerPublic(() => catalogueApi.listProducts(query), 60);
}
