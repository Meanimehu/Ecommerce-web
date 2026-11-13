import type { NextRequest } from 'next/server';
import * as cartApi from '@/api/cart';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import { PendingAddSchema } from '@/types/cart';

/** POST /api/cart/items: add a variant to the cart. Never repeated automatically: repeating it would add twice (Document 3, section 6). */
export async function POST(request: NextRequest) {
  const body = PendingAddSchema.safeParse(await jsonObject(request));
  if (!body.success) return fail('VALIDATION_FAILED', 400);
  const code = request.nextUrl.searchParams.get('couponCode') ?? undefined;
  return answerAsUser(request, (token) => cartApi.addToCart(token, body.data, code), { change: true });
}
