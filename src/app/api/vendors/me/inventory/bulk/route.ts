import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as stockApi from '@/features/stock/server/stock-api';
import type { BulkStockBody } from '@/features/stock/types';

/** POST /api/vendors/me/inventory/bulk: set many quantities by SKU, all or nothing. */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every row and refuses unknown fields.
  return answerAsUser(request, (token) => stockApi.bulkSetStock(token, body as BulkStockBody), {
    change: true,
  });
}
