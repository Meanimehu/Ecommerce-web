import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as stockApi from '@/features/stock/server/stock-api';

/** GET /api/vendors/me/inventory: the vendor's stock, one row per variant. */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = ['status', 'q', 'productId', 'page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => stockApi.listMyStock(token, query));
}
