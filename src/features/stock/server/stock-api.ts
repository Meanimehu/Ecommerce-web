import 'server-only';
import { callBackend } from '@/api/client';
import type { Query } from '@/utils/url';
import {
  BulkStockResultSchema,
  StockHistoryPageSchema,
  StockPageSchema,
  StockRowSchema,
  StockSummarySchema,
  type AdjustStockBody,
  type BulkStockBody,
  type SetStockBody,
  type SetThresholdBody,
} from '@/features/stock/types';

/**
 * Backend Area 4, the vendor's own stock (area-4-inventory.md, section 1). One function per
 * backend operation. Bodies are passed on as the browser sent them; the backend checks every field
 * and refuses unknown ones. Reading works for a vendor in any status; changes need an approved one.
 */
const MY_STOCK_PATH = '/vendors/me/inventory';
const myVariantStockPath = (variantId: string) =>
  `${MY_STOCK_PATH}/variants/${encodeURIComponent(variantId)}`;

export const listMyStock = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: MY_STOCK_PATH,
    query,
    kind: 'view',
    token,
    schema: StockPageSchema,
  });

export const getMyStockSummary = (token: string) =>
  callBackend({
    method: 'GET',
    path: `${MY_STOCK_PATH}/summary`,
    kind: 'view',
    token,
    schema: StockSummarySchema,
  });

export const setStock = (token: string, variantId: string, body: SetStockBody) =>
  callBackend({
    method: 'PUT',
    path: myVariantStockPath(variantId),
    body,
    kind: 'save',
    token,
    schema: StockRowSchema,
  });

export const adjustStock = (token: string, variantId: string, body: AdjustStockBody) =>
  callBackend({
    method: 'POST',
    path: `${myVariantStockPath(variantId)}/adjust`,
    body,
    kind: 'save',
    token,
    schema: StockRowSchema,
  });

export const setThreshold = (token: string, variantId: string, body: SetThresholdBody) =>
  callBackend({
    method: 'PATCH',
    path: myVariantStockPath(variantId),
    body,
    kind: 'save',
    token,
    schema: StockRowSchema,
  });

export const listStockHistory = (token: string, variantId: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: `${myVariantStockPath(variantId)}/history`,
    query,
    kind: 'view',
    token,
    schema: StockHistoryPageSchema,
  });

export const bulkSetStock = (token: string, body: BulkStockBody) =>
  callBackend({
    method: 'POST',
    path: `${MY_STOCK_PATH}/bulk`,
    body,
    kind: 'save',
    token,
    schema: BulkStockResultSchema,
  });

/** Any variant's stock history, for admins, moderators and support (area-4-inventory.md). */
export const staffStockHistory = (token: string, variantId: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: `/admin/inventory/variants/${encodeURIComponent(variantId)}/history`,
    query,
    kind: 'view',
    token,
    schema: StockHistoryPageSchema,
  });
