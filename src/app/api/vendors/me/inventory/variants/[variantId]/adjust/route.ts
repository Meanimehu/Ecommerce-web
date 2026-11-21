import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as stockApi from '@/features/stock/server/stock-api';
import type { AdjustStockBody } from '@/features/stock/types';

/** POST /api/vendors/me/inventory/variants/{variantId}/adjust: add or remove units. */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ variantId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { variantId } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => stockApi.adjustStock(token, variantId, body as AdjustStockBody),
    { change: true },
  );
}
