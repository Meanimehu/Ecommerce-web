import 'server-only';
import { callBackend } from '@/api/client';
import type { Query } from '@/utils/url';
import {
  SalePageSchema,
  SaleSchema,
  type CancelSaleBody,
  type CreateSaleBody,
} from '@/features/sales/types';

/**
 * Backend Area 5, part 1, the vendor's own sale prices. One function per backend operation. Bodies
 * are passed on as the browser sent them; the backend checks every field and refuses unknown ones.
 * Reading works for a vendor in any status; creating and cancelling need an approved one.
 */
const MY_SALES_PATH = '/vendors/me/sales';

export const listMySales = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: MY_SALES_PATH,
    query,
    kind: 'view',
    token,
    schema: SalePageSchema,
  });

export const createSale = (token: string, body: CreateSaleBody) =>
  callBackend({
    method: 'POST',
    path: MY_SALES_PATH,
    body,
    kind: 'save',
    token,
    schema: SaleSchema,
  });

export const cancelSale = (token: string, id: string, body: CancelSaleBody) =>
  callBackend({
    method: 'POST',
    path: `${MY_SALES_PATH}/${encodeURIComponent(id)}/cancel`,
    body,
    kind: 'save',
    token,
    schema: SaleSchema,
  });
