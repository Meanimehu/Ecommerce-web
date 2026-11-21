'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, put, send } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import type {
  AdjustStockBody,
  BulkStockBody,
  BulkStockResult,
  SetStockBody,
  SetThresholdBody,
  StockHistoryEntry,
  StockRow,
  StockSummary,
} from '@/features/stock/types';

/**
 * The calls of `stock`, one hook per call, to our own /api/vendors/me/inventory endpoints, never
 * to the backend (D3-03). After any change the stock is read again, whatever the outcome, so the
 * screens show what the backend now holds and never their own sum (Document 5, section 7.4).
 */
const MY_STOCK_PATH = '/api/vendors/me/inventory';
const variantPath = (variantId: string) =>
  `${MY_STOCK_PATH}/variants/${encodeURIComponent(variantId)}`;

export const stockKeys = {
  all: ['stock'] as const,
  list: (query: Query) => ['stock', 'list', query] as const,
  summary: ['stock', 'summary'] as const,
  history: (variantId: string, query: Query) => ['stock', 'history', variantId, query] as const,
  staffHistory: (variantId: string, query: Query) =>
    ['stock', 'staff-history', variantId, query] as const,
  everyRow: ['stock', 'every-row'] as const,
};

/** The most rows a page of the stock list holds, and how many pages are read to check a bulk update. */
const FULL_PAGE = 100;
const MOST_PAGES = 10;

export function useMyStock(query: Query) {
  return useQuery({
    queryKey: stockKeys.list(query),
    queryFn: () => get<Page<StockRow>>(withQuery(MY_STOCK_PATH, query)),
    staleTime: 0,
  });
}

export function useStockSummary() {
  return useQuery({
    queryKey: stockKeys.summary,
    queryFn: () => get<StockSummary>(`${MY_STOCK_PATH}/summary`),
    staleTime: 0,
  });
}

export function useStockHistory(variantId: string, query: Query) {
  return useQuery({
    queryKey: stockKeys.history(variantId, query),
    queryFn: () =>
      get<Page<StockHistoryEntry>>(withQuery(`${variantPath(variantId)}/history`, query)),
    staleTime: 0,
  });
}

/** Any variant's stock history, for staff, from /api/admin/inventory. */
export function useStaffStockHistory(variantId: string, query: Query) {
  return useQuery({
    queryKey: stockKeys.staffHistory(variantId, query),
    queryFn: () =>
      get<Page<StockHistoryEntry>>(
        withQuery(`/api/admin/inventory/variants/${encodeURIComponent(variantId)}/history`, query),
      ),
    staleTime: 0,
  });
}

/**
 * Every stock row, read page by page (up to 1,000 variants), only when `enabled`: after a bulk
 * update whose outcome is unknown, the screen shows each typed SKU's stock now (Document 5,
 * section 7.4), and never sends the table again by itself.
 */
export function useEveryStockRow(enabled: boolean) {
  return useQuery({
    queryKey: stockKeys.everyRow,
    queryFn: async () => {
      const rows: StockRow[] = [];
      for (let page = 1; page <= MOST_PAGES; page += 1) {
        const answer = await get<Page<StockRow>>(
          withQuery(MY_STOCK_PATH, { page, limit: FULL_PAGE }),
        );
        rows.push(...answer.items);
        if (rows.length >= answer.total || answer.items.length === 0) break;
      }
      return rows;
    },
    enabled,
    staleTime: 0,
  });
}

/** Every change reads all stock again afterwards, whatever the outcome. */
function useReloadStock() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: stockKeys.all });
}

export function useSetStock(variantId: string) {
  const reloadStock = useReloadStock();
  return useMutation({
    mutationFn: (body: SetStockBody) => put<StockRow>(variantPath(variantId), body),
    onSettled: reloadStock,
  });
}

export function useAdjustStock(variantId: string) {
  const reloadStock = useReloadStock();
  return useMutation({
    mutationFn: (body: AdjustStockBody) => send<StockRow>(`${variantPath(variantId)}/adjust`, body),
    onSettled: reloadStock,
  });
}

export function useSetThreshold(variantId: string) {
  const reloadStock = useReloadStock();
  return useMutation({
    mutationFn: (body: SetThresholdBody) => patch<StockRow>(variantPath(variantId), body),
    onSettled: reloadStock,
  });
}

export function useBulkSetStock() {
  const reloadStock = useReloadStock();
  return useMutation({
    mutationFn: (body: BulkStockBody) => send<BulkStockResult>(`${MY_STOCK_PATH}/bulk`, body),
    onSettled: reloadStock,
  });
}
