import 'server-only';
import { callBackend } from '@/api/client';
import { BackendErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import type { Query } from '@/utils/url';
import {
  CategoryTreeSchema,
  ProductCardPageSchema,
  ProductDetailSchema,
  type ProductDetail,
} from '@/features/storefront/types';

/**
 * Backend Area 3a, the storefront part (area-3a-catalogue.md, section 1): no login, and the answer
 * is the same for everyone.
 */

export const getCategoryTree = () =>
  callBackend({
    method: 'GET',
    path: '/catalogue/categories',
    kind: 'view',
    schema: CategoryTreeSchema,
  });

export const listProducts = (query: Query) =>
  callBackend({
    method: 'GET',
    path: '/catalogue/products',
    query,
    kind: 'view',
    schema: ProductCardPageSchema,
  });

export const getProduct = (id: string) =>
  callBackend({
    method: 'GET',
    path: `/catalogue/products/${encodeURIComponent(id)}`,
    kind: 'view',
    schema: ProductDetailSchema,
  });

/**
 * One product for its page, or null when the backend says it does not exist or is not visible:
 * the page then answers with a real 404 (Document 4, D4-02). Any other failure is the error page.
 */
export async function findVisibleProduct(id: string): Promise<ProductDetail | null> {
  try {
    return (await getProduct(id)).data;
  } catch (caughtError) {
    if (caughtError instanceof AppError && caughtError.code === BackendErrorCode.ProductNotFound) {
      return null;
    }
    throw caughtError;
  }
}
