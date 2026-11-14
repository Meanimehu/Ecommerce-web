import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as cartApi from '@/features/cart/server/cart-api';
import { couponCodeOf } from '@/features/cart/server/cart-request';
import { CartAddSchema } from '@/features/cart/types';

/** POST /api/cart/items: add a variant to the cart. Never repeated automatically: repeating it would add twice (Document 3, section 6). */
export async function POST(request: NextRequest) {
  const body = CartAddSchema.safeParse(await jsonObject(request));
  if (!body.success) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  return answerAsUser(
    request,
    (token) => cartApi.addToCart(token, body.data, couponCodeOf(request)),
    { change: true },
  );
}
