import 'server-only';
import { callBackend } from '@/api/client';
import type { Query } from '@/utils/url';
import {
  CouponRequestPageSchema,
  CouponRequestSchema,
  CouponRequestViewSchema,
  type ChangeCouponRequestBody,
  type CreateCouponRequestBody,
  type WithdrawCouponRequestBody,
} from '@/features/coupon/types';

/**
 * Backend Area 5, part 4, a vendor's coupon requests: list, one with its history, a new draft, a
 * change, submit and withdraw. One function per backend operation. Bodies are passed on as the
 * browser sent them; the backend checks every field and refuses unknown ones. Reading works in any
 * vendor status; every change needs an approved vendor.
 */
const MY_REQUESTS_PATH = '/vendors/me/coupon-requests';
const myRequestPath = (id: string) => `${MY_REQUESTS_PATH}/${encodeURIComponent(id)}`;

export const listMyCouponRequests = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: MY_REQUESTS_PATH,
    query,
    kind: 'view',
    token,
    schema: CouponRequestPageSchema,
  });

export const getMyCouponRequest = (token: string, id: string) =>
  callBackend({
    method: 'GET',
    path: myRequestPath(id),
    kind: 'view',
    token,
    schema: CouponRequestViewSchema,
  });

export const createCouponRequest = (token: string, body: CreateCouponRequestBody) =>
  callBackend({
    method: 'POST',
    path: MY_REQUESTS_PATH,
    kind: 'save',
    token,
    body,
    schema: CouponRequestSchema,
  });

export const changeCouponRequest = (token: string, id: string, body: ChangeCouponRequestBody) =>
  callBackend({
    method: 'PATCH',
    path: myRequestPath(id),
    kind: 'save',
    token,
    body,
    schema: CouponRequestSchema,
  });

export const submitCouponRequest = (token: string, id: string) =>
  callBackend({
    method: 'POST',
    path: `${myRequestPath(id)}/submit`,
    kind: 'save',
    token,
    schema: CouponRequestSchema,
  });

export const withdrawCouponRequest = (token: string, id: string, body: WithdrawCouponRequestBody) =>
  callBackend({
    method: 'POST',
    path: `${myRequestPath(id)}/withdraw`,
    kind: 'save',
    token,
    body,
    schema: CouponRequestSchema,
  });
