'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BackendErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { get, patch, put, remove, send, upload } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import {
  PhotoSize,
  type AddVariantBody,
  type ChangeProductBody,
  type ChangeVariantBody,
  type CreateProductBody,
  type Dictionaries,
  type ModerationRow,
  type ModerationView,
  type Photo,
  type Product,
  type ProductDecisionInput,
  type ProductRow,
  type ProductView,
  type Revision,
  type RevisionGallery,
  type Variant,
} from '@/features/product/types';

/**
 * The calls of `product`, one hook per call, to our own /api/vendors/me/products and
 * /api/moderation endpoints, never to the backend (D3-03). After every change the product is read
 * again, so the screen (and its `missing` list) shows what the backend holds.
 */
const MY_PRODUCTS_PATH = '/api/vendors/me/products';
const myProductPath = (id: string) => `${MY_PRODUCTS_PATH}/${encodeURIComponent(id)}`;
const myVariantPath = (id: string, variantId: string) =>
  `${myProductPath(id)}/variants/${encodeURIComponent(variantId)}`;
const myPhotoPath = (id: string, imageId: string) =>
  `${myProductPath(id)}/images/${encodeURIComponent(imageId)}`;
const REVIEW_QUEUE_PATH = '/api/moderation/products';
const reviewProductPath = (id: string) => `${REVIEW_QUEUE_PATH}/${encodeURIComponent(id)}`;

/** The form guide changes rarely: categories, brands, sizes, colours and tax codes. */
const DICTIONARIES_STALE_MS = 600_000;
const LIST_STALE_MS = 30_000;

/** The key of the product that is not made yet; its read never runs. */
const NEW_PRODUCT_KEY = 'new';

export const productKeys = {
  dictionaries: ['product', 'dictionaries'] as const,
  /** Every list of the vendor's products. */
  lists: ['product', 'list'] as const,
  list: (query: Query) => ['product', 'list', query] as const,
  one: (id: string) => ['product', id] as const,
  /** Under the product's key, so every change to the product reads its revision again too. */
  revision: (id: string) => ['product', id, 'revision'] as const,
};

export const moderationKeys = {
  /** Every moderation read: the queue and each product. */
  all: ['moderation'] as const,
  list: (query: Query) => ['moderation', 'list', query] as const,
  one: (id: string) => ['moderation', id] as const,
};

// ---- The vendor's products ----

export const useDictionaries = () =>
  useQuery({
    queryKey: productKeys.dictionaries,
    queryFn: () => get<Dictionaries>('/api/catalogue/dictionaries'),
    staleTime: DICTIONARIES_STALE_MS,
  });

export const useMyProducts = (query: Query) =>
  useQuery({
    queryKey: productKeys.list(query),
    queryFn: () => get<Page<ProductRow>>(withQuery(MY_PRODUCTS_PATH, query)),
    staleTime: LIST_STALE_MS,
  });

/** One product in full; nothing is read while it is not made yet (id null). */
export const useMyProduct = (id: string | null) =>
  useQuery({
    queryKey: productKeys.one(id ?? NEW_PRODUCT_KEY),
    queryFn: () => get<ProductView>(myProductPath(id ?? '')),
    staleTime: 0,
    enabled: id !== null,
  });

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductBody) => send<Product>(MY_PRODUCTS_PATH, body),
    onSettled: () => queryClient.invalidateQueries({ queryKey: productKeys.lists }),
  });
}

/** A change to one product; the product and the lists are read again, whatever the outcome. */
function useProductChange<TInput, TResult>(id: string, run: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.one(id) }),
        queryClient.invalidateQueries({ queryKey: productKeys.lists }),
      ]),
  });
}

export const useChangeProduct = (id: string) =>
  useProductChange(id, (body: ChangeProductBody) => patch<Product>(myProductPath(id), body));

export const useDeleteProduct = (id: string) =>
  useProductChange(id, () => remove(myProductPath(id)));

export const useSubmitProduct = (id: string) =>
  useProductChange(id, () => send<Product>(`${myProductPath(id)}/submit`));

export const useAddVariant = (id: string) =>
  useProductChange(id, (body: AddVariantBody) =>
    send<Variant>(`${myProductPath(id)}/variants`, body),
  );

export interface VariantChange {
  variantId: string;
  body: ChangeVariantBody;
}

/** Changes one variant; switching it off or on is a change of its status. */
export const useChangeVariant = (id: string) =>
  useProductChange(id, ({ variantId, body }: VariantChange) =>
    patch<Variant>(myVariantPath(id, variantId), body),
  );

export const useDeleteVariant = (id: string) =>
  useProductChange(id, (variantId: string) => remove(myVariantPath(id, variantId)));

export interface PhotoUploadInput {
  file: File;
  onProgress: (fraction: number) => void;
  signal: AbortSignal;
}

export const useUploadPhoto = (id: string) =>
  useProductChange(id, ({ file, onProgress, signal }: PhotoUploadInput) => {
    const formData = new FormData();
    formData.append('file', file);
    return upload<Photo>(`${myProductPath(id)}/images`, formData, { onProgress, signal });
  });

/** Every photo id once, in the new order; the first becomes the main photo. */
export const useOrderPhotos = (id: string) =>
  useProductChange(id, (imageIds: string[]) =>
    put<Photo[]>(`${myProductPath(id)}/images/order`, { imageIds }),
  );

export interface PhotoChange {
  imageId: string;
  altText: string | null;
}

export const useChangePhoto = (id: string) =>
  useProductChange(id, ({ imageId, altText }: PhotoChange) =>
    patch<Photo>(myPhotoPath(id, imageId), { altText }),
  );

export const useDeletePhoto = (id: string) =>
  useProductChange(id, (imageId: string) => remove(myPhotoPath(id, imageId)));

/** A private photo preview through our server (D3-04). */
export const myPhotoSrc = (id: string, imageId: string, size: PhotoSize = PhotoSize.Thumb) =>
  `${myPhotoPath(id, imageId)}/file?size=${size}`;

// ---- Revisions: changes to an approved product ----

const myRevisionPath = (id: string) => `${myProductPath(id)}/revision`;
const myRevisionPhotoPath = (id: string, imageId: string) =>
  `${myRevisionPath(id)}/images/${encodeURIComponent(imageId)}`;

/**
 * The product's revision, or null when it has none: REVISION_NOT_FOUND is the expected answer for
 * an approved product nobody has proposed changes to, not an error to show (Document 7, 20.9).
 */
export const useRevision = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: productKeys.revision(id),
    queryFn: async () => {
      try {
        return await get<Revision>(myRevisionPath(id));
      } catch (caughtError) {
        if (
          caughtError instanceof AppError &&
          caughtError.code === BackendErrorCode.RevisionNotFound
        ) {
          return null;
        }
        throw caughtError;
      }
    },
    staleTime: 0,
    enabled,
  });

/** Proposes content changes; the first one starts the revision. */
export const useChangeRevision = (id: string) =>
  useProductChange(id, (body: ChangeProductBody) => patch<Revision>(myRevisionPath(id), body));

export const useDiscardRevision = (id: string) =>
  useProductChange(id, () => remove(myRevisionPath(id)));

export const useSubmitRevision = (id: string) =>
  useProductChange(id, () => send<Revision>(`${myRevisionPath(id)}/submit`));

export const useWithdrawRevision = (id: string) =>
  useProductChange(id, () => send<Revision>(`${myRevisionPath(id)}/withdraw`));

export const useUploadRevisionPhoto = (id: string) =>
  useProductChange(id, ({ file, onProgress, signal }: PhotoUploadInput) => {
    const formData = new FormData();
    formData.append('file', file);
    return upload<RevisionGallery>(`${myRevisionPath(id)}/images`, formData, {
      onProgress,
      signal,
    });
  });

/** Every photo of the proposed gallery once, in the new order; the first becomes the cover. */
export const useOrderRevisionPhotos = (id: string) =>
  useProductChange(id, (imageIds: string[]) =>
    put<RevisionGallery>(`${myRevisionPath(id)}/images/order`, { imageIds }),
  );

export const useChangeRevisionPhoto = (id: string) =>
  useProductChange(id, ({ imageId, altText }: PhotoChange) =>
    patch<RevisionGallery>(myRevisionPhotoPath(id, imageId), { altText }),
  );

/** A proposed photo is deleted; a live one is marked for removal until the revision is approved. */
export const useRemoveRevisionPhoto = (id: string) =>
  useProductChange(id, (imageId: string) =>
    remove<RevisionGallery>(myRevisionPhotoPath(id, imageId)),
  );

export const useRestoreRevisionPhoto = (id: string) =>
  useProductChange(id, (imageId: string) =>
    send<RevisionGallery>(`${myRevisionPhotoPath(id, imageId)}/restore`),
  );

// ---- Moderation ----

export const useReviewQueue = (query: Query) =>
  useQuery({
    queryKey: moderationKeys.list(query),
    queryFn: () => get<Page<ModerationRow>>(withQuery(REVIEW_QUEUE_PATH, query)),
    staleTime: LIST_STALE_MS,
  });

export const useProductForReview = (id: string) =>
  useQuery({
    queryKey: moderationKeys.one(id),
    queryFn: () => get<ModerationView>(reviewProductPath(id)),
    staleTime: 0,
  });

export function useDecideProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ decision, body }: ProductDecisionInput) =>
      send<ModerationView>(`${reviewProductPath(id)}/${decision}`, body),
    onSettled: () => queryClient.invalidateQueries({ queryKey: moderationKeys.all }),
  });
}

/** A photo under review through our server (D3-04). */
export const reviewPhotoSrc = (id: string, imageId: string, size: PhotoSize = PhotoSize.Medium) =>
  `${reviewProductPath(id)}/images/${encodeURIComponent(imageId)}/file?size=${size}`;
