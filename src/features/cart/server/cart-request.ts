import 'server-only';
import type { NextRequest } from 'next/server';

/** The coupon code a cart call should preview, from our endpoint's address (`?couponCode=`). */
const COUPON_CODE_PARAM = 'couponCode';

export const couponCodeOf = (request: NextRequest) =>
  request.nextUrl.searchParams.get(COUPON_CODE_PARAM) ?? undefined;
