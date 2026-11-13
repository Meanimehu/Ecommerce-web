import type { NextRequest } from 'next/server';
import * as cartApi from '@/api/cart';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';

/** PATCH (quantity) and DELETE /api/cart/items/{variantId}. */
type Context = { params: Promise<{ variantId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { variantId } = await params;
  const body = await jsonObject(request);
  if (!body) return fail('VALIDATION_FAILED', 400);
  const code = request.nextUrl.searchParams.get('couponCode') ?? undefined;
  return answerAsUser(request, (token) => cartApi.changeQuantity(token, variantId, body, code), { change: true });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { variantId } = await params;
  const code = request.nextUrl.searchParams.get('couponCode') ?? undefined;
  return answerAsUser(request, (token) => cartApi.removeLine(token, variantId, code), { change: true });
}
