import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as productApi from '@/features/product/server/product-api';
import type { CreateProductBody } from '@/features/product/types';

/** GET and POST /api/vendors/me/products: the vendor's products, and a new draft. */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = ['status', 'q', 'page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => productApi.listMyProducts(token, query));
}

export async function POST(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => productApi.createProduct(token, body as CreateProductBody),
    { change: true },
  );
}
