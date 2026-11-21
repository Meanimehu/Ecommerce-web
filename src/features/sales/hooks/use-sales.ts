'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, send } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import type { CreateSaleBody, Sale, StaffSale } from '@/features/sales/types';

/**
 * The calls of `sales`, one hook per call, to our own /api/vendors/me/sales endpoints, never to the
 * backend (D3-03). After a change the list is read again, so the screen shows the backend's own
 * status for each sale.
 */
const MY_SALES_PATH = '/api/vendors/me/sales';

export const salesKeys = {
  all: ['sales'] as const,
  list: (query: Query) => ['sales', 'list', query] as const,
  staffList: (query: Query) => ['sales', 'staff', query] as const,
};

export function useMySales(query: Query) {
  return useQuery({
    queryKey: salesKeys.list(query),
    queryFn: () => get<Page<Sale>>(withQuery(MY_SALES_PATH, query)),
    staleTime: 0,
  });
}

function useReloadSales() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: salesKeys.all });
}

export function useCreateSale() {
  const reloadSales = useReloadSales();
  return useMutation({
    mutationFn: (body: CreateSaleBody) => send<Sale>(MY_SALES_PATH, body),
    onSettled: reloadSales,
  });
}

export function useCancelSale() {
  const reloadSales = useReloadSales();
  return useMutation({
    mutationFn: (id: string) => send<Sale>(`${MY_SALES_PATH}/${encodeURIComponent(id)}/cancel`),
    onSettled: reloadSales,
  });
}

/** Every vendor's sales, for staff, from /api/admin/sales; not asked while a filter has the wrong shape. */
export function useStaffSales(query: Query, enabled: boolean) {
  return useQuery({
    queryKey: salesKeys.staffList(query),
    queryFn: () => get<Page<StaffSale>>(withQuery('/api/admin/sales', query)),
    staleTime: 0,
    enabled,
  });
}

export function useStaffCancelSale() {
  const reloadSales = useReloadSales();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      send<StaffSale>(`/api/admin/sales/${encodeURIComponent(id)}/cancel`, { reason }),
    onSettled: reloadSales,
  });
}
