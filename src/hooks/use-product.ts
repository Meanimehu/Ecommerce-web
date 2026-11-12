'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, put, remove, send, upload } from '@/lib/http';
import type { Page } from '@/types/common';
import type { Dictionaries, Photo, Product, ProductRow, ProductView, Variant } from '@/types/product';
import { withQuery, type Query } from '@/utils/url';

/**
 * The vendor's own products (backend Area 3b), for the screens (D-02), through our /api/vendors/me/products endpoints.
 * After every change the product is read again, so the screen (and its `missing` list) shows what the backend holds.
 */
export const productKeys = {
  dictionaries: ['product', 'dictionaries'] as const,
  list: (query: Query) => ['product', 'list', query] as const,
  one: (id: string) => ['product', id] as const,
};

const base = (id: string) => `/api/vendors/me/products/${encodeURIComponent(id)}`;

export const useDictionaries = () => useQuery({ queryKey: productKeys.dictionaries, queryFn: () => get<Dictionaries>('/api/catalogue/dictionaries'), staleTime: 600_000 });

export const useMyProducts = (query: Query) =>
  useQuery({ queryKey: productKeys.list(query), queryFn: () => get<Page<ProductRow>>(withQuery('/api/vendors/me/products', query)), staleTime: 30_000 });

export const useMyProduct = (id: string | null) =>
  useQuery({ queryKey: productKeys.one(id ?? 'new'), queryFn: () => get<ProductView>(base(id ?? '')), staleTime: 0, enabled: id !== null });

/** A change to one product; the product and the list are read again afterwards, whatever the outcome. */
function useProductChange<TInput, TResult>(id: string, run: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSettled: () => Promise.all([queryClient.invalidateQueries({ queryKey: productKeys.one(id) }), queryClient.invalidateQueries({ queryKey: ['product', 'list'] })]),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (body: Record<string, unknown>) => send<Product>('/api/vendors/me/products', body), onSettled: () => queryClient.invalidateQueries({ queryKey: ['product', 'list'] }) });
}

export const useChangeProduct = (id: string) => useProductChange(id, (body: Record<string, unknown>) => patch<Product>(base(id), body));
export const useDeleteProduct = (id: string) => useProductChange(id, () => remove(base(id)));
export const useSubmitProduct = (id: string) => useProductChange(id, () => send<Product>(`${base(id)}/submit`));

export const useSaveVariant = (id: string) =>
  useProductChange(id, ({ variantId, body }: { variantId?: string; body: Record<string, unknown> }) =>
    variantId ? patch<Variant>(`${base(id)}/variants/${encodeURIComponent(variantId)}`, body) : send<Variant>(`${base(id)}/variants`, body),
  );
export const useDeleteVariant = (id: string) => useProductChange(id, (variantId: string) => remove(`${base(id)}/variants/${encodeURIComponent(variantId)}`));

export const useUploadPhoto = (id: string) =>
  useProductChange(id, ({ file, onProgress, signal }: { file: File; onProgress: (fraction: number) => void; signal: AbortSignal }) => {
    const form = new FormData();
    form.append('file', file);
    return upload<Photo>(`${base(id)}/images`, form, { onProgress, signal });
  });
export const useOrderPhotos = (id: string) => useProductChange(id, (imageIds: string[]) => put<Photo[]>(`${base(id)}/images/order`, { imageIds }));
export const useChangePhoto = (id: string) =>
  useProductChange(id, ({ imageId, altText }: { imageId: string; altText: string | null }) => patch<Photo>(`${base(id)}/images/${encodeURIComponent(imageId)}`, { altText }));
export const useDeletePhoto = (id: string) => useProductChange(id, (imageId: string) => remove(`${base(id)}/images/${encodeURIComponent(imageId)}`));

/** A private photo preview through our server (D3-04). */
export const myPhotoSrc = (id: string, imageId: string, size: 'thumb' | 'medium' | 'large' = 'thumb') => `${base(id)}/images/${encodeURIComponent(imageId)}/file?size=${size}`;
