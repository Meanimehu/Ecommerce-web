import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as salesApi from '@/features/sales/server/sales-api';

/** GET /api/admin/sales: every vendor's sales, for staff (Area 5, part 1). */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = ['status', 'vendorId', 'variantId', 'page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => salesApi.listAllSales(token, query));
}
