'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, send } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import type { ChangeCouponBody, Coupon, CreateCouponBody } from '@/features/coupon/types';

/**
 * The calls of `coupon`, one hook per call, to our own /api/admin/coupons endpoints, never to the
 * backend (D3-03). After any change every coupon read is read again, so the screens show the
 * backend's own status and usage.
 */
const ADMIN_COUPONS_PATH = '/api/admin/coupons';
const adminCouponPath = (id: string) => `${ADMIN_COUPONS_PATH}/${encodeURIComponent(id)}`;

export const couponKeys = {
  all: ['coupon'] as const,
  staffList: (query: Query) => ['coupon', 'staff', 'list', query] as const,
  staffOne: (id: string) => ['coupon', 'staff', id] as const,
};

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
