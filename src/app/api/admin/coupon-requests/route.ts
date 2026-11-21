import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as requestApi from '@/features/coupon/server/coupon-request-api';

/** GET /api/admin/coupon-requests: every vendor's coupon requests, for staff. */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = ['status', 'vendorId', 'page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => requestApi.listAllCouponRequests(token, query));
}
