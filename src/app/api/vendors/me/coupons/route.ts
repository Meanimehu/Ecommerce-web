import type { NextRequest } from 'next/server';
import { pick } from '@/utils/url';
import { answerAsUser } from '@/features/auth/server/answer-as-user';
import * as couponApi from '@/features/coupon/server/coupon-api';

/** GET /api/vendors/me/coupons: the coupons that charge the vendor (any vendor status). */
export const dynamic = 'force-dynamic';

const LIST_QUERY_NAMES = ['status', 'page', 'limit'];

export function GET(request: NextRequest) {
  const query = pick(request.nextUrl.searchParams, LIST_QUERY_NAMES);
  return answerAsUser(request, (token) => couponApi.listMyCoupons(token, query));
}
