import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as couponApi from '@/features/coupon/server/coupon-api';

/** POST /api/vendors/me/coupons/{id}/disable: stop a coupon, or decline a pending one. */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => couponApi.disableMyCoupon(token, id), { change: true });
}
