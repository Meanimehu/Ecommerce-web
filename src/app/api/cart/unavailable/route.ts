import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as cartApi from '@/features/cart/server/cart-api';
import { couponCodeOf } from '@/features/cart/server/cart-request';

/** DELETE /api/cart/unavailable: remove every line that cannot be bought (the backend decides which). */
export function DELETE(request: NextRequest) {
  return answerAsUser(request, (token) => cartApi.removeUnavailable(token, couponCodeOf(request)), {
    change: true,
  });
}
