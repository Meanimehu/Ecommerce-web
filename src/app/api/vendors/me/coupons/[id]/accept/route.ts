import type { NextRequest } from 'next/server';
import { jsonObject } from '@/middleware/endpoint';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as couponApi from '@/features/coupon/server/coupon-api';
import type { AcceptCouponBody } from '@/features/coupon/types';

/** POST /api/vendors/me/coupons/{id}/accept: accept the exact terms shown, by their digest. */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = (await jsonObject(request)) ?? {};
  // Passed on as the browser sent it; the backend checks the digest against the current terms.
  return answerAsUser(
    request,
    (token) => couponApi.acceptMyCoupon(token, id, body as AcceptCouponBody),
    { change: true },
  );
}
