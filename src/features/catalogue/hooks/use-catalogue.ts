'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, send } from '@/lib/http';
import type { Category, CatalogueList, EditableList, GstRate, HsnCode } from '@/features/catalogue/types';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';

/**
 * The admin catalogue lists (backend Area 3a), for the screens (D-02), through our /api/admin/catalogue endpoints.
 * After a change the list is read again, so the screen shows what the backend holds (its answer to a change can carry
 * an older updatedAt: area-3a-catalogue.md, "Rules for the admin lists").
 */
export const catalogueKeys = { list: (list: CatalogueList, query: Query = {}) => ['catalogue', 'admin', list, query] as const };

export function useCatalogueList<T>(list: CatalogueList, query: Query = {}) {
  return useQuery({
    queryKey: catalogueKeys.list(list, query),
    queryFn: () => get<Page<T> | { items: T[] }>(withQuery(`/api/admin/catalogue/${list}`, query)),
    staleTime: 30_000,
  });
}

/** Active GST rates and HSN codes, for the default-tax choices (up to 100 each, the backend's largest page). */
export const useActiveGstRates = () => useCatalogueList<GstRate>('gst-rates', { isActive: 'true', limit: 100 });
export const useActiveHsnCodes = () => useCatalogueList<HsnCode>('hsn-codes', { isActive: 'true', limit: 100 });
export const useAllCategories = () => useCatalogueList<Category>('categories');

export function useSaveCatalogueItem(list: EditableList) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Record<string, unknown> }) =>
      id ? patch<unknown>(`/api/admin/catalogue/${list}/${encodeURIComponent(id)}`, body) : send<unknown>(`/api/admin/catalogue/${list}`, body),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['catalogue', 'admin'] }),
  });
}
