import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as salesApi from '@/features/sales/server/sales-api';
import type { CreateSaleBody } from '@/features/sales/types';

/** GET and POST /api/vendors/me/sales: the vendor's sales, and a new one. */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = ['status', 'variantId', 'page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => salesApi.listMySales(token, query));
}

export async function POST(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(request, (token) => salesApi.createSale(token, body as CreateSaleBody), {
    change: true,
  });
}
