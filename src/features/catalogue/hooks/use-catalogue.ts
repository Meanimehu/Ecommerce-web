'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, send } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import {
  CatalogueList,
  type AddBody,
  type Category,
  type ChangeBody,
  type EditableList,
  type GstRate,
  type HsnCode,
} from '@/features/catalogue/types';

/**
 * The calls of `catalogue`, one hook per call, through our /api/admin/catalogue endpoints (D-02).
 * After a change the lists are read again, so the screen shows what the backend holds: its answer
 * to a change can carry an older updatedAt (area-3a-catalogue.md, "Rules for the admin lists").
 */
const listPath = (list: CatalogueList) => `/api/admin/catalogue/${list}`;

/** The backend's largest page: enough for every active GST rate and HSN code as a choice. */
const LARGEST_PAGE = 100;

export const catalogueKeys = {
  /** Every admin catalogue read. */
  admin: ['catalogue', 'admin'] as const,
  list: (list: CatalogueList, query: Query = {}) => ['catalogue', 'admin', list, query] as const,
};

export function useCatalogueList<Item>(list: CatalogueList, query: Query = {}) {
  return useQuery({
    queryKey: catalogueKeys.list(list, query),
    queryFn: () => get<Page<Item> | { items: Item[] }>(withQuery(listPath(list), query)),
    staleTime: 30_000,
  });
}

/** Active GST rates and HSN codes, for the default-tax choices. */
export const useActiveGstRates = () =>
  useCatalogueList<GstRate>(CatalogueList.GstRates, { isActive: 'true', limit: LARGEST_PAGE });
export const useActiveHsnCodes = () =>
  useCatalogueList<HsnCode>(CatalogueList.HsnCodes, { isActive: 'true', limit: LARGEST_PAGE });
export const useAllCategories = () => useCatalogueList<Category>(CatalogueList.Categories);

function useReloadCatalogue() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: catalogueKeys.admin });
}

export function useAddCatalogueItem<List extends EditableList>(list: List) {
  const reloadCatalogue = useReloadCatalogue();
  return useMutation({
    mutationFn: (body: AddBody<List>) => send<unknown>(listPath(list), body),
    onSettled: reloadCatalogue,
  });
}

export interface CatalogueChange<List extends EditableList> {
  id: string;
  body: ChangeBody<List>;
}

/** Changes one entry; switching it off or on is a change of isActive. */
export function useChangeCatalogueItem<List extends EditableList>(list: List) {
  const reloadCatalogue = useReloadCatalogue();
  return useMutation({
    mutationFn: ({ id, body }: CatalogueChange<List>) =>
      patch<unknown>(`${listPath(list)}/${encodeURIComponent(id)}`, body),
    onSettled: reloadCatalogue,
  });
}
