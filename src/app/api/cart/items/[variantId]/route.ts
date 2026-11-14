import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as cartApi from '@/features/cart/server/cart-api';
import { couponCodeOf } from '@/features/cart/server/cart-request';

/** PATCH (quantity) and DELETE /api/cart/items/{variantId}. The backend checks the quantity. */
type Context = { params: Promise<{ variantId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { variantId } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  return answerAsUser(
    request,
    (token) => cartApi.changeQuantity(token, variantId, body, couponCodeOf(request)),
    { change: true },
  );
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { variantId } = await params;
  return answerAsUser(
    request,
    (token) => cartApi.removeLine(token, variantId, couponCodeOf(request)),
    { change: true },
  );
}
