import 'server-only';
import { callBackend } from '@/api/client';
import type { Query } from '@/utils/url';
import {
  CouponPageSchema,
  CouponSchema,
  type AcceptCouponBody,
  type ChangeCouponBody,
  type CouponReasonBody,
  type CreateCouponBody,
} from '@/features/coupon/types';

/**
 * Backend Area 5, part 3, the staff's coupons: list, one coupon, create, change, disable with a
 * reason, enable. One function per backend operation. Bodies are passed on as the browser sent
 * them; the backend checks every field and refuses unknown ones. Admin and marketing change;
 * finance and support read.
 */
const ADMIN_COUPONS_PATH = '/admin/coupons';
const adminCouponPath = (id: string) => `${ADMIN_COUPONS_PATH}/${encodeURIComponent(id)}`;

export const listAllCoupons = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: ADMIN_COUPONS_PATH,
    query,
    kind: 'view',
    token,
    schema: CouponPageSchema,
  });

export const getCoupon = (token: string, id: string) =>
  callBackend({
    method: 'GET',
    path: adminCouponPath(id),
    kind: 'view',
    token,
    schema: CouponSchema,
  });

export const createCoupon = (token: string, body: CreateCouponBody) =>
  callBackend({
    method: 'POST',
    path: ADMIN_COUPONS_PATH,
    kind: 'save',
    token,
    body,
    schema: CouponSchema,
  });

export const changeCoupon = (token: string, id: string, body: ChangeCouponBody) =>
  callBackend({
    method: 'PATCH',
    path: adminCouponPath(id),
    kind: 'save',
    token,
    body,
    schema: CouponSchema,
  });

export const disableCoupon = (token: string, id: string, body: CouponReasonBody) =>
  callBackend({
    method: 'POST',
    path: `${adminCouponPath(id)}/disable`,
    kind: 'save',
    token,
    body,
    schema: CouponSchema,
  });

export const enableCoupon = (token: string, id: string) =>
  callBackend({
    method: 'POST',
    path: `${adminCouponPath(id)}/enable`,
    kind: 'save',
    token,
    schema: CouponSchema,
  });

// ---- The coupons that charge the vendor (Area 5, part 3, vendor sections) ----

const MY_COUPONS_PATH = '/vendors/me/coupons';
const myCouponPath = (id: string) => `${MY_COUPONS_PATH}/${encodeURIComponent(id)}`;

/** Reading works in any vendor status. */
export const listMyCoupons = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: MY_COUPONS_PATH,
    query,
    kind: 'view',
    token,
    schema: CouponPageSchema,
  });

/** Accepting the exact terms shown (their digest) needs an approved vendor. */
export const acceptMyCoupon = (token: string, id: string, body: AcceptCouponBody) =>
  callBackend({
    method: 'POST',
    path: `${myCouponPath(id)}/accept`,
    kind: 'save',
    token,
    body,
    schema: CouponSchema,
  });

/** Disabling, which declines a pending coupon, works in any vendor status. */
export const disableMyCoupon = (token: string, id: string) =>
  callBackend({
    method: 'POST',
    path: `${myCouponPath(id)}/disable`,
    kind: 'save',
    token,
    body: {},
    schema: CouponSchema,
  });
