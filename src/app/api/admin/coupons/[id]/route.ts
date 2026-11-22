import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as couponApi from '@/features/coupon/server/coupon-api';
import type { ChangeCouponBody } from '@/features/coupon/types';

/** GET and PATCH /api/admin/coupons/{id}: one coupon with its usage, and a change to its terms. */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => couponApi.getCoupon(token, id));
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend decides what may still change.
  return answerAsUser(
    request,
    (token) => couponApi.changeCoupon(token, id, body as ChangeCouponBody),
    { change: true },
  );
}
