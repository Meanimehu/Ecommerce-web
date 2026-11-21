import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as requestApi from '@/features/coupon/server/coupon-request-api';
import type { CreateCouponRequestBody } from '@/features/coupon/types';

/** GET and POST /api/vendors/me/coupon-requests: the vendor's coupon requests, and a new draft. */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = ['status', 'page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => requestApi.listMyCouponRequests(token, query));
}

export async function POST(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every term and refuses unknown fields.
  return answerAsUser(
    request,
    (token) => requestApi.createCouponRequest(token, body as CreateCouponRequestBody),
    { change: true },
  );
}
