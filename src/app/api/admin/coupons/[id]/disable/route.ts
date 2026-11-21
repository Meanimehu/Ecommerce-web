import type { NextRequest } from 'next/server';
import { jsonObject } from '@/middleware/endpoint';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as couponApi from '@/features/coupon/server/coupon-api';
import type { CouponReasonBody } from '@/features/coupon/types';

/** POST /api/admin/coupons/{id}/disable: stop a coupon, with a reason (admin, marketing). */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = (await jsonObject(request)) ?? {};
  // Passed on as the browser sent it; the backend checks the reason and refuses unknown fields.
  return answerAsUser(
    request,
    (token) => couponApi.disableCoupon(token, id, body as CouponReasonBody),
    { change: true },
  );
}
