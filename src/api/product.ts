import 'server-only';
import { z } from 'zod';
import { DictionariesSchema, PhotoSchema, ProductPageSchema, ProductSchema, ProductViewSchema, VariantSchema } from '@/types/product';
import type { Query } from '@/utils/url';
import { callBackend, openBackendFile, type UploadBody } from './client';

/**
 * Backend Area 3b, the vendor's own products (area-3b-products.md, sections 1 to 4): the form guide, products,
 * variants and photos. Bodies are passed as the browser sent them; the backend checks every field.
 */
type Body = Record<string, unknown>;
const product = (id: string) => `/vendors/me/products/${encodeURIComponent(id)}`;

export const getDictionaries = (token: string) => callBackend({ method: 'GET', path: '/catalogue/dictionaries', kind: 'view', token, schema: DictionariesSchema });

export const listMyProducts = (token: string, query: Query) =>
  callBackend({ method: 'GET', path: '/vendors/me/products', query, kind: 'view', token, schema: ProductPageSchema });

export const getMyProduct = (token: string, id: string) => callBackend({ method: 'GET', path: product(id), kind: 'view', token, schema: ProductViewSchema });

export const createProduct = (token: string, body: Body) =>
  callBackend({ method: 'POST', path: '/vendors/me/products', kind: 'save', token, body, schema: ProductSchema });

export const changeProduct = (token: string, id: string, body: Body) => callBackend({ method: 'PATCH', path: product(id), kind: 'save', token, body, schema: ProductSchema });

export const deleteProduct = (token: string, id: string) => callBackend({ method: 'DELETE', path: product(id), kind: 'save', token, schema: null });

export const submitProduct = (token: string, id: string) => callBackend({ method: 'POST', path: `${product(id)}/submit`, kind: 'save', token, schema: ProductSchema });

export const addVariant = (token: string, id: string, body: Body) =>
  callBackend({ method: 'POST', path: `${product(id)}/variants`, kind: 'save', token, body, schema: VariantSchema });

export const changeVariant = (token: string, id: string, variantId: string, body: Body) =>
  callBackend({ method: 'PATCH', path: `${product(id)}/variants/${encodeURIComponent(variantId)}`, kind: 'save', token, body, schema: VariantSchema });

export const deleteVariant = (token: string, id: string, variantId: string) =>
  callBackend({ method: 'DELETE', path: `${product(id)}/variants/${encodeURIComponent(variantId)}`, kind: 'save', token, schema: null });

export const uploadPhoto = (token: string, id: string, upload: UploadBody) =>
  callBackend({ method: 'POST', path: `${product(id)}/images`, kind: 'upload', token, upload, schema: PhotoSchema });

export const orderPhotos = (token: string, id: string, body: Body) =>
  callBackend({ method: 'PUT', path: `${product(id)}/images/order`, kind: 'save', token, body, schema: z.array(PhotoSchema) });

export const changePhoto = (token: string, id: string, imageId: string, body: Body) =>
  callBackend({ method: 'PATCH', path: `${product(id)}/images/${encodeURIComponent(imageId)}`, kind: 'save', token, body, schema: PhotoSchema });

export const deletePhoto = (token: string, id: string, imageId: string) =>
  callBackend({ method: 'DELETE', path: `${product(id)}/images/${encodeURIComponent(imageId)}`, kind: 'save', token, schema: null });

/** A private photo preview (thumb, medium or large). */
export const openMyPhoto = (token: string, id: string, imageId: string, size: string) =>
  openBackendFile({ path: `${product(id)}/images/${encodeURIComponent(imageId)}/file?size=${encodeURIComponent(size)}`, token });
