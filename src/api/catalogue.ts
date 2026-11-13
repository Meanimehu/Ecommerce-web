import 'server-only';
import { CategoryTreeSchema, ProductCardPageSchema, ProductDetailSchema } from '@/types/catalogue';
import type { Query } from '@/utils/url';
import { callBackend } from './client';

/**
 * Backend Area 3a, the storefront part (area-3a-catalogue.md, section 1). The admin lists are in
 * src/features/catalogue/server/catalogue-api.ts; this part moves with the storefront (Document 7, 20.13, step 8).
 */

// ---- Storefront (section 1): no login; the answer is the same for everyone. ----

export const getCategoryTree = () => callBackend({ method: 'GET', path: '/catalogue/categories', kind: 'view', schema: CategoryTreeSchema });

export const listProducts = (query: Query) => callBackend({ method: 'GET', path: '/catalogue/products', query, kind: 'view', schema: ProductCardPageSchema });

export const getProduct = (id: string) => callBackend({ method: 'GET', path: `/catalogue/products/${encodeURIComponent(id)}`, kind: 'view', schema: ProductDetailSchema });
