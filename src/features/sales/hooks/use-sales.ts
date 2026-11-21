'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, send } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import type { CreateSaleBody, Sale } from '@/features/sales/types';

/**
 * The calls of `sales`, one hook per call, to our own /api/vendors/me/sales endpoints, never to the
 * backend (D3-03). After a change the list is read again, so the screen shows the backend's own
 * status for each sale.
 */
const MY_SALES_PATH = '/api/vendors/me/sales';

export const salesKeys = {
  all: ['sales'] as const,
  list: (query: Query) => ['sales', 'list', query] as const,
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
