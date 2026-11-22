import 'server-only';
import { callBackend, openBackendFile, type UploadBody } from '@/api/client';
import type { Query } from '@/utils/url';
import { ImportColumnsSchema, ImportPageSchema, ImportSchema } from '@/features/product/types';

/**
 * Backend Area 3b, CSV import (area-3b-products.md, section 7): the column guide, the example file,
 * an upload that only checks the file, the vendor's imports, and the confirm that creates the
 * drafts. One function per backend operation. The file passes through as it arrives and is never
 * kept here.
 */
const MY_IMPORTS_PATH = '/vendors/me/imports';
const myImportPath = (id: string) => `${MY_IMPORTS_PATH}/${encodeURIComponent(id)}`;

export const getImportColumns = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: `${MY_IMPORTS_PATH}/columns`,
    query,
    kind: 'view',
    token,
    schema: ImportColumnsSchema,
  });

export const openImportTemplate = (token: string, query: Query) =>
  openBackendFile({ path: `${MY_IMPORTS_PATH}/template`, query, token });

export const uploadImport = (token: string, upload: UploadBody) =>
  callBackend({
    method: 'POST',
    path: MY_IMPORTS_PATH,
    kind: 'upload',
    token,
    upload,
    schema: ImportSchema,
  });

export const listMyImports = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: MY_IMPORTS_PATH,
    query,
    kind: 'view',
    token,
    schema: ImportPageSchema,
  });

export const getMyImport = (token: string, id: string) =>
  callBackend({ method: 'GET', path: myImportPath(id), kind: 'view', token, schema: ImportSchema });

export const confirmImport = (token: string, id: string) =>
  callBackend({
    method: 'POST',
    path: `${myImportPath(id)}/confirm`,
    kind: 'save',
    token,
    schema: ImportSchema,
  });
