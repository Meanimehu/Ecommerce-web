import type { NextRequest } from 'next/server';
import * as productApi from '@/features/product/server/product-api';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import { pick } from '@/utils/url';

/** GET and POST /api/vendors/me/products: the vendor's products, and a new draft. */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, ['status', 'q', 'page', 'limit']);
  return answerAsUser(request, (token) => productApi.listMyProducts(token, query));
}

export async function POST(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  return answerAsUser(request, (token) => productApi.createProduct(token, body), { change: true });
}
