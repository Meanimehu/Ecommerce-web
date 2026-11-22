import type { NextRequest } from 'next/server';
import { BackendErrorCode } from '@/lib/error-codes';
import { HttpStatus } from '@/lib/http-status';
import { jsonObject } from '@/middleware/endpoint';
import { fail } from '@/middleware/responses';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as couponApi from '@/features/coupon/server/coupon-api';
import type { CreateCouponBody } from '@/features/coupon/types';

/** GET and POST /api/admin/coupons: every coupon, for staff, and a new one (admin, marketing). */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = ['status', 'vendorId', 'code', 'page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => couponApi.listAllCoupons(token, query));
}

export async function POST(request: NextRequest) {
  const body = await jsonObject(request);
  if (!body) return fail(BackendErrorCode.ValidationFailed, HttpStatus.BadRequest);
  // Passed on as the browser sent it; the backend checks every term and refuses unknown fields.
  return answerAsUser(request, (token) => couponApi.createCoupon(token, body as CreateCouponBody), {
    change: true,
  });
}
