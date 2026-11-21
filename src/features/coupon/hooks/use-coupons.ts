'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, send } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import type {
  ChangeCouponBody,
  ChangeCouponRequestBody,
  Coupon,
  CouponRequest,
  CouponRequestView,
  CreateCouponBody,
  CreateCouponRequestBody,
} from '@/features/coupon/types';

/**
 * The calls of `coupon`, one hook per call, to our own /api/admin/coupons and
 * /api/vendors/me/coupons endpoints, never to the backend (D3-03). After any change every coupon read is read again, so the screens show the
 * backend's own status and usage.
 */
const ADMIN_COUPONS_PATH = '/api/admin/coupons';
const adminCouponPath = (id: string) => `${ADMIN_COUPONS_PATH}/${encodeURIComponent(id)}`;

export const couponKeys = {
  all: ['coupon'] as const,
  staffList: (query: Query) => ['coupon', 'staff', 'list', query] as const,
  staffOne: (id: string) => ['coupon', 'staff', id] as const,
  mine: (query: Query) => ['coupon', 'mine', query] as const,
};

const MY_COUPONS_PATH = '/api/vendors/me/coupons';
const myCouponPath = (id: string) => `${MY_COUPONS_PATH}/${encodeURIComponent(id)}`;

export const useStaffCoupons = (query: Query, enabled = true) =>
  useQuery({
    queryKey: couponKeys.staffList(query),
    queryFn: () => get<Page<Coupon>>(withQuery(ADMIN_COUPONS_PATH, query)),
    enabled,
  });

export const useStaffCoupon = (id: string) =>
  useQuery({
    queryKey: couponKeys.staffOne(id),
    queryFn: () => get<Coupon>(adminCouponPath(id)),
  });

function useReloadCoupons() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: couponKeys.all });
}

export function useCreateCoupon() {
  const reloadCoupons = useReloadCoupons();
  return useMutation({
    mutationFn: (body: CreateCouponBody) => send<Coupon>(ADMIN_COUPONS_PATH, body),
    onSettled: reloadCoupons,
  });
}

export function useChangeCoupon(id: string) {
  const reloadCoupons = useReloadCoupons();
  return useMutation({
    mutationFn: (body: ChangeCouponBody) => patch<Coupon>(adminCouponPath(id), body),
    onSettled: reloadCoupons,
  });
}

export function useDisableCoupon(id: string) {
  const reloadCoupons = useReloadCoupons();
  return useMutation({
    mutationFn: (reason: string) => send<Coupon>(`${adminCouponPath(id)}/disable`, { reason }),
    onSettled: reloadCoupons,
  });
}

export function useEnableCoupon(id: string) {
  const reloadCoupons = useReloadCoupons();
  return useMutation({
    mutationFn: () => send<Coupon>(`${adminCouponPath(id)}/enable`),
    onSettled: reloadCoupons,
  });
}

// ---- The coupons that charge the vendor ----

/**
 * Not read again when the window regains focus: the vendor accepts the exact terms on screen, so
 * they never change under the vendor's eyes. They are read again after every change.
 */
export const useMyCoupons = (query: Query) =>
  useQuery({
    queryKey: couponKeys.mine(query),
    queryFn: () => get<Page<Coupon>>(withQuery(MY_COUPONS_PATH, query)),
    refetchOnWindowFocus: false,
  });

export function useAcceptMyCoupon() {
  const reloadCoupons = useReloadCoupons();
  return useMutation({
    mutationFn: ({ id, termsDigest }: { id: string; termsDigest: string }) =>
      send<Coupon>(`${myCouponPath(id)}/accept`, { termsDigest }),
    onSettled: reloadCoupons,
  });
}

export function useDisableMyCoupon() {
  const reloadCoupons = useReloadCoupons();
  return useMutation({
    mutationFn: (id: string) => send<Coupon>(`${myCouponPath(id)}/disable`),
    onSettled: reloadCoupons,
  });
}

// ---- The vendor's coupon requests ----

const MY_REQUESTS_PATH = '/api/vendors/me/coupon-requests';
const myRequestPath = (id: string) => `${MY_REQUESTS_PATH}/${encodeURIComponent(id)}`;

export const couponRequestKeys = {
  all: ['coupon-request'] as const,
  mine: (query: Query) => ['coupon-request', 'mine', query] as const,
  mineOne: (id: string) => ['coupon-request', 'mine', id] as const,
};

/** After a change, the requests and the coupons are read again (an approved one makes a coupon). */
function useReloadRequests() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: couponRequestKeys.all }),
      queryClient.invalidateQueries({ queryKey: couponKeys.all }),
    ]);
}

export const useMyCouponRequests = (query: Query) =>
  useQuery({
    queryKey: couponRequestKeys.mine(query),
    queryFn: () => get<Page<CouponRequest>>(withQuery(MY_REQUESTS_PATH, query)),
  });

export const useMyCouponRequest = (id: string) =>
  useQuery({
    queryKey: couponRequestKeys.mineOne(id),
    queryFn: () => get<CouponRequestView>(myRequestPath(id)),
  });

export function useCreateCouponRequest() {
  const reloadRequests = useReloadRequests();
  return useMutation({
    mutationFn: (body: CreateCouponRequestBody) => send<CouponRequest>(MY_REQUESTS_PATH, body),
    onSettled: reloadRequests,
  });
}

export function useChangeCouponRequest(id: string) {
  const reloadRequests = useReloadRequests();
  return useMutation({
    mutationFn: (body: ChangeCouponRequestBody) => patch<CouponRequest>(myRequestPath(id), body),
    onSettled: reloadRequests,
  });
}

export function useSubmitCouponRequest(id: string) {
  const reloadRequests = useReloadRequests();
  return useMutation({
    mutationFn: () => send<CouponRequest>(`${myRequestPath(id)}/submit`),
    onSettled: reloadRequests,
  });
}

export function useWithdrawCouponRequest(id: string) {
  const reloadRequests = useReloadRequests();
  return useMutation({
    mutationFn: () => send<CouponRequest>(`${myRequestPath(id)}/withdraw`),
    onSettled: reloadRequests,
  });
}
