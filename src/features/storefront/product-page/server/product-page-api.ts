import 'server-only';
import { callBackend } from '@/api/client';
import { BackendErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { ProductDetailSchema, type ProductDetail } from '@/features/storefront/product-page/types';

/**
 * Backend Area 3a, one product as a customer sees it (area-3a-catalogue.md, section 1): no login,
 * and the answer is the same for everyone.
 */

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
