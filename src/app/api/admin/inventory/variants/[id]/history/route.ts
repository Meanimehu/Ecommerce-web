import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as stockApi from '@/features/stock/server/stock-api';

/** GET /api/admin/inventory/variants/{id}/history: any variant's stock history, for staff (area-4-inventory.md). */
export const dynamic = 'force-dynamic';

const HISTORY_QUERY_NAMES = ['page', 'limit'];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const query = pick(request.nextUrl.searchParams, HISTORY_QUERY_NAMES);
  return answerAsUser(request, (token) => stockApi.staffStockHistory(token, id, query));
}
