import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as couponApi from '@/features/coupon/server/coupon-api';

/** POST /api/admin/coupons/{id}/enable: start a disabled coupon again (admin, marketing). */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => couponApi.enableCoupon(token, id), { change: true });
}
