import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as productApi from '@/api/product';

/** GET /api/catalogue/dictionaries: what the product form offers (area-3b-products.md, section 1). */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return answerAsUser(request, (token) => productApi.getDictionaries(token));
}
