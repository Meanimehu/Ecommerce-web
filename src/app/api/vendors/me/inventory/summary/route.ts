import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as stockApi from '@/features/stock/server/stock-api';

/** GET /api/vendors/me/inventory/summary: how many variants are in stock, low and out. */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return answerAsUser(request, (token) => stockApi.getMyStockSummary(token));
}
