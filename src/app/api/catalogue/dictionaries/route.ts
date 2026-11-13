import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as productApi from '@/features/product/server/product-api';

/**
 * GET /api/catalogue/dictionaries: what the product form offers (area-3b-products.md, section 1).
 * Its address is the backend's own; it belongs to `product`, the only feature that uses it.
 */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return answerAsUser(request, (token) => productApi.getDictionaries(token));
}
