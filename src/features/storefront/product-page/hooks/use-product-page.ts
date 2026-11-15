'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/http';
import type { ProductDetail } from '@/features/storefront/product-page/types';

/**
 * The calls of `product-page`, one hook per call, to our own /api/catalogue endpoint (D3-03). The
 * page arrives drawn on the server; this reads again in the browser what must be current.
 */
const productDetailPath = (id: string) => `/api/catalogue/products/${encodeURIComponent(id)}`;

export const productPageKeys = {
  product: (id: string) => ['storefront', 'product', id] as const,
};

/**
 * One product as it is now. The page may have been kept for a while (Document 4, section 7), so it
 * is read again when the page opens, and that answer gives the price and stock.
 */
export const useProductNow = (product: ProductDetail) =>
  useQuery({
    queryKey: productPageKeys.product(product.id),
    queryFn: () => get<ProductDetail>(productDetailPath(product.id)),
    initialData: product,
    staleTime: 0,
    refetchOnMount: 'always',
  });
