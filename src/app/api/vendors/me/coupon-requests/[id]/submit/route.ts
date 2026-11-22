import type { NextRequest } from 'next/server';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as requestApi from '@/features/coupon/server/coupon-request-api';

/** POST /api/vendors/me/coupon-requests/{id}/submit: send a draft, or a changed request, for review. */
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => requestApi.submitCouponRequest(token, id), {
    change: true,
  });
}
