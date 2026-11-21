import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as stockApi from '@/features/stock/server/stock-api';

/** GET /api/vendors/me/inventory/variants/{variantId}/history: the variant's stock history. */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ variantId: string }> };

const HISTORY_QUERY_NAMES = ['page', 'limit'];

export async function GET(request: NextRequest, { params }: Context) {
  const { variantId } = await params;
  const query = pick(request.nextUrl.searchParams, HISTORY_QUERY_NAMES);
  return answerAsUser(request, (token) => stockApi.listStockHistory(token, variantId, query));
}
