import 'server-only';
import { CATALOGUE_ITEMS, CATALOGUE_LISTS, type CatalogueList, type EditableList } from '@/types/catalogue';
import type { Query } from '@/utils/url';
import { callBackend } from './client';

/**
 * Backend Area 3a, the admin catalogue lists (area-3a-catalogue.md, sections 2 to 6): one list, one add and one change
 * for each of GST rates, HSN codes, categories, brands, sizes and colours. The list name is the backend's own path
 * segment. Bodies are passed as the browser sent them; the backend checks every field and refuses unknown ones.
 */
export const listCatalogue = (token: string, list: CatalogueList, query: Query) =>
  callBackend({ method: 'GET', path: `/admin/catalogue/${list}`, query: list === 'categories' ? undefined : query, kind: 'view', token, schema: CATALOGUE_LISTS[list] });

export const addCatalogueItem = (token: string, list: EditableList, body: Record<string, unknown>) =>
  callBackend({ method: 'POST', path: `/admin/catalogue/${list}`, kind: 'save', token, body, schema: CATALOGUE_ITEMS[list] });

export const changeCatalogueItem = (token: string, list: EditableList, id: string, body: Record<string, unknown>) =>
  callBackend({ method: 'PATCH', path: `/admin/catalogue/${list}/${encodeURIComponent(id)}`, kind: 'save', token, body, schema: CATALOGUE_ITEMS[list] });
