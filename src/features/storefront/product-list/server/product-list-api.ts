import 'server-only';
import { callBackend } from '@/api/client';
import type { Query } from '@/utils/url';
import {
  CategoryTreeSchema,
  ProductCardPageSchema,
} from '@/features/storefront/product-list/types';

/**
 * Backend Area 3a, the lists a customer sees (area-3a-catalogue.md, section 1): no login, and the
 * answer is the same for everyone.
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
