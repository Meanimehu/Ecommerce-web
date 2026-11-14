import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as cartApi from '@/features/cart/server/cart-api';

/** GET /api/cart?couponCode=: the person's cart, with a coupon previewed when a code is sent (it is never stored). */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('couponCode') ?? undefined;
  return answerAsUser(request, (token) => cartApi.getCart(token, code));
}
