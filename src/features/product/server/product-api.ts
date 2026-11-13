import 'server-only';
import { z } from 'zod';
import { callBackend, openBackendFile, type UploadBody } from '@/api/client';
import type { Query } from '@/utils/url';
import {
  DictionariesSchema,
  PhotoSchema,
  ProductPageSchema,
  ProductSchema,
  ProductViewSchema,
  VariantSchema,
  type AddVariantBody,
  type ChangePhotoBody,
  type ChangeProductBody,
  type ChangeVariantBody,
  type CreateProductBody,
  type OrderPhotosBody,
  type PhotoSize,
} from '@/features/product/types';

/**
 * Backend Area 3b, the vendor's own products (area-3b-products.md, sections 1 to 4): the form
 * guide, products, variants and photos. One function per backend operation. Bodies are passed on
 * as the browser sent them; the backend checks every field and refuses unknown ones.
 */
const MY_PRODUCTS_PATH = '/vendors/me/products';
const myProductPath = (id: string) => `${MY_PRODUCTS_PATH}/${encodeURIComponent(id)}`;
const myVariantPath = (id: string, variantId: string) =>
  `${myProductPath(id)}/variants/${encodeURIComponent(variantId)}`;
const myPhotoPath = (id: string, imageId: string) =>
  `${myProductPath(id)}/images/${encodeURIComponent(imageId)}`;

export const getDictionaries = (token: string) =>
  callBackend({
    method: 'GET',
    path: '/catalogue/dictionaries',
    kind: 'view',
    token,
    schema: DictionariesSchema,
  });

export const listMyProducts = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: MY_PRODUCTS_PATH,
    query,
    kind: 'view',
    token,
    schema: ProductPageSchema,
  });

export const getMyProduct = (token: string, id: string) =>
  callBackend({
    method: 'GET',
    path: myProductPath(id),
    kind: 'view',
    token,
    schema: ProductViewSchema,
  });

export const createProduct = (token: string, body: CreateProductBody) =>
  callBackend({
    method: 'POST',
    path: MY_PRODUCTS_PATH,
    kind: 'save',
    token,
    body,
    schema: ProductSchema,
  });

export const changeProduct = (token: string, id: string, body: ChangeProductBody) =>
  callBackend({
    method: 'PATCH',
    path: myProductPath(id),
    kind: 'save',
    token,
    body,
    schema: ProductSchema,
  });

export const deleteProduct = (token: string, id: string) =>
  callBackend({ method: 'DELETE', path: myProductPath(id), kind: 'save', token, schema: null });

export const submitProduct = (token: string, id: string) =>
  callBackend({
    method: 'POST',
    path: `${myProductPath(id)}/submit`,
    kind: 'save',
    token,
    schema: ProductSchema,
  });

export const addVariant = (token: string, id: string, body: AddVariantBody) =>
  callBackend({
    method: 'POST',
    path: `${myProductPath(id)}/variants`,
    kind: 'save',
    token,
    body,
    schema: VariantSchema,
  });

export const changeVariant = (
  token: string,
  id: string,
  variantId: string,
  body: ChangeVariantBody,
) =>
  callBackend({
    method: 'PATCH',
    path: myVariantPath(id, variantId),
    kind: 'save',
    token,
    body,
    schema: VariantSchema,
  });

export const deleteVariant = (token: string, id: string, variantId: string) =>
  callBackend({
    method: 'DELETE',
    path: myVariantPath(id, variantId),
    kind: 'save',
    token,
    schema: null,
  });

export const uploadPhoto = (token: string, id: string, upload: UploadBody) =>
  callBackend({
    method: 'POST',
    path: `${myProductPath(id)}/images`,
    kind: 'upload',
    token,
    upload,
    schema: PhotoSchema,
  });

export const orderPhotos = (token: string, id: string, body: OrderPhotosBody) =>
  callBackend({
    method: 'PUT',
    path: `${myProductPath(id)}/images/order`,
    kind: 'save',
    token,
    body,
    schema: z.array(PhotoSchema),
  });

export const changePhoto = (token: string, id: string, imageId: string, body: ChangePhotoBody) =>
  callBackend({
    method: 'PATCH',
    path: myPhotoPath(id, imageId),
    kind: 'save',
    token,
    body,
    schema: PhotoSchema,
  });

export const deletePhoto = (token: string, id: string, imageId: string) =>
  callBackend({
    method: 'DELETE',
    path: myPhotoPath(id, imageId),
    kind: 'save',
    token,
    schema: null,
  });

/** A private photo preview, in one of the stored sizes. */
export const openMyPhoto = (token: string, id: string, imageId: string, size: PhotoSize) =>
  openBackendFile({
    path: `${myPhotoPath(id, imageId)}/file?size=${encodeURIComponent(size)}`,
    token,
  });
