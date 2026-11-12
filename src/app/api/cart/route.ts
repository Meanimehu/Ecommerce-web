import type { NextRequest } from 'next/server';
import * as cartApi from '@/api/cart';
import { answerAsUser } from '@/middleware/endpoint';

/** GET /api/cart?couponCode=: the person's cart, with a coupon previewed when a code is sent (it is never stored). */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('couponCode') ?? undefined;
  return answerAsUser(request, (token) => cartApi.getCart(token, code));
}
