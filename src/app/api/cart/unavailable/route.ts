import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as cartApi from '@/features/cart/server/cart-api';

/** DELETE /api/cart/unavailable: remove every line that cannot be bought (the backend decides which). */
export function DELETE(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('couponCode') ?? undefined;
  return answerAsUser(request, (token) => cartApi.removeUnavailable(token, code), { change: true });
}
