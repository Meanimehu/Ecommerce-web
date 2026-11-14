import { answerPublic } from '@/middleware/endpoint';
import * as storefrontApi from '@/features/storefront/server/storefront-api';

/**
 * GET /api/catalogue/categories: the public category tree (area-3a-catalogue.md); fresh for 10
 * minutes (Document 7, section 12).
 */
export const dynamic = 'force-dynamic';

const FRESH_SECONDS = 600;

export function GET() {
  return answerPublic(() => storefrontApi.getCategoryTree(), FRESH_SECONDS);
}
