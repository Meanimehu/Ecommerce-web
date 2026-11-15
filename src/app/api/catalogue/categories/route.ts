import { answerPublic } from '@/middleware/endpoint';
import * as productListApi from '@/features/storefront/product-list/server/product-list-api';

/**
 * GET /api/catalogue/categories: the public category tree (area-3a-catalogue.md); fresh for 10
 * minutes (Document 7, section 12).
 */
export const dynamic = 'force-dynamic';

const FRESH_SECONDS = 600;

export function GET() {
  return answerPublic(() => productListApi.getCategoryTree(), FRESH_SECONDS);
}
