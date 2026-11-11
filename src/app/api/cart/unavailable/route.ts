import type { NextRequest } from 'next/server';
import * as cartApi from '@/api/cart';
import { answerAsUser } from '@/middleware/endpoint';

/** DELETE /api/cart/unavailable: remove every line that cannot be bought (the backend decides which). */
export function DELETE(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('couponCode') ?? undefined;
  return answerAsUser(request, (token) => cartApi.removeUnavailable(token, code), { change: true });
}
