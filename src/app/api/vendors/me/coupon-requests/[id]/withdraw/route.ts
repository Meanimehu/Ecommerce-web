import type { NextRequest } from 'next/server';
import { jsonObject } from '@/middleware/endpoint';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as requestApi from '@/features/coupon/server/coupon-request-api';
import type { WithdrawCouponRequestBody } from '@/features/coupon/types';

/** POST /api/vendors/me/coupon-requests/{id}/withdraw: take back a request not yet decided. */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = (await jsonObject(request)) ?? {};
  return answerAsUser(
    request,
    (token) => requestApi.withdrawCouponRequest(token, id, body as WithdrawCouponRequestBody),
    { change: true },
  );
}
