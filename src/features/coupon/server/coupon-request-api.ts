import 'server-only';
import { callBackend } from '@/api/client';
import type { Query } from '@/utils/url';
import {
  CouponRequestPageSchema,
  CouponRequestSchema,
  CouponRequestViewSchema,
  type ApproveCouponRequestBody,
  type ChangeCouponRequestBody,
  type CouponRequestNoteBody,
  type CreateCouponRequestBody,
  type RequestDecision,
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

// ---- The staff's review (admin and marketing decide; finance and support read) ----

const ADMIN_REQUESTS_PATH = '/admin/coupon-requests';
const adminRequestPath = (id: string) => `${ADMIN_REQUESTS_PATH}/${encodeURIComponent(id)}`;

export const listAllCouponRequests = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: ADMIN_REQUESTS_PATH,
    query,
    kind: 'view',
    token,
    schema: CouponRequestPageSchema,
  });

export const getCouponRequest = (token: string, id: string) =>
  callBackend({
    method: 'GET',
    path: adminRequestPath(id),
    kind: 'view',
    token,
    schema: CouponRequestViewSchema,
  });

/** The three decisions, each on a submitted request only. */
export const decideCouponRequest = (
  token: string,
  id: string,
  decision: RequestDecision,
  body: ApproveCouponRequestBody | CouponRequestNoteBody,
) =>
  callBackend({
    method: 'POST',
    path: `${adminRequestPath(id)}/${decision}`,
    kind: 'save',
    token,
    body,
    schema: CouponRequestSchema,
  });
