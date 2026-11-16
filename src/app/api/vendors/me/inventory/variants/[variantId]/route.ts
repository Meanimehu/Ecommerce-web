import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as stockApi from '@/features/stock/server/stock-api';
import type { SetStockBody, SetThresholdBody } from '@/features/stock/types';

/** PUT and PATCH /api/vendors/me/inventory/variants/{variantId}: set the quantity, or the threshold. */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ variantId: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  const { variantId } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every field and refuses unknown ones.
  return answerAsUser(
    request,
    (token) => stockApi.setStock(token, variantId, body as SetStockBody),
    { change: true },
  );
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { variantId } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  return answerAsUser(
    request,
    (token) => stockApi.setThreshold(token, variantId, body as SetThresholdBody),
    { change: true },
  );
}
