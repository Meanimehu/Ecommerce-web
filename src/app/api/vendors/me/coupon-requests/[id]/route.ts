import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as requestApi from '@/features/coupon/server/coupon-request-api';
import type { ChangeCouponRequestBody } from '@/features/coupon/types';

/** GET and PATCH /api/vendors/me/coupon-requests/{id}: one request with its history, a change. */
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return answerAsUser(request, (token) => requestApi.getMyCouponRequest(token, id));
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks the status and every term.
  return answerAsUser(
    request,
    (token) => requestApi.changeCouponRequest(token, id, body as ChangeCouponRequestBody),
    { change: true },
  );
}
