import type { NextRequest } from 'next/server';
import * as productApi from '@/api/product';
import { answerAsUser, jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
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
