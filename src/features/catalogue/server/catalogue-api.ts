import 'server-only';
import { callBackend } from '@/api/client';
import type { Query } from '@/utils/url';
import {
  CATALOGUE_ITEMS,
  CATALOGUE_LISTS,
  CatalogueList,
  type AddBody,
  type ChangeBody,
  type EditableList,
} from '@/features/catalogue/types';

/**
 * Backend Area 3a, the admin catalogue lists (area-3a-catalogue.md, sections 2 to 6): one list, one
 * add and one change for each of GST rates, HSN codes, categories, brands, sizes and colours. The
 * list name is the backend's own path segment. Bodies are passed on as the browser sent them; the
 * backend checks every field and refuses unknown ones.
 */
const listPath = (list: CatalogueList) => `/admin/catalogue/${list}`;

export const listCatalogue = (token: string, list: CatalogueList, query: Query) =>
  callBackend({
    method: 'GET',
    path: listPath(list),
    // Categories come as one whole list, never in pages.
    query: list === CatalogueList.Categories ? undefined : query,
    kind: 'view',
    token,
    schema: CATALOGUE_LISTS[list],
  });

export const addCatalogueItem = <List extends EditableList>(
  token: string,
  list: List,
  body: AddBody<List>,
) =>
  callBackend({
    method: 'POST',
    path: listPath(list),
    kind: 'save',
    token,
    body,
    schema: CATALOGUE_ITEMS[list],
  });

export const changeCatalogueItem = <List extends EditableList>(
  token: string,
  list: List,
  id: string,
  body: ChangeBody<List>,
) =>
  callBackend({
    method: 'PATCH',
    path: `${listPath(list)}/${encodeURIComponent(id)}`,
    kind: 'save',
    token,
    body,
    schema: CATALOGUE_ITEMS[list],
  });
