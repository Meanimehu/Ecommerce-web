import type { NextRequest } from 'next/server';
import * as productApi from '@/api/product';
import { answerAsUser } from '@/middleware/endpoint';

/** GET /api/catalogue/dictionaries: what the product form offers (area-3b-products.md, section 1). */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return answerAsUser(request, (token) => productApi.getDictionaries(token));
}
