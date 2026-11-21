'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, send, upload } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import type { Import, ImportColumns, ImportSummary } from '@/features/product/types';
import { productKeys } from './use-product';

/**
 * The calls of CSV import, one hook per call, to our own /api/vendors/me/imports (never the
 * backend, D3-03). After an upload or a confirm, the imports and the product lists are read again,
 * so every screen shows what the backend holds.
 */
const MY_IMPORTS_PATH = '/api/vendors/me/imports';
const myImportPath = (id: string) => `${MY_IMPORTS_PATH}/${encodeURIComponent(id)}`;

/** The column guide changes only when an admin changes a category's attributes. */
const COLUMNS_STALE_MS = 600_000;

export const importKeys = {
  all: ['import'] as const,
  list: (query: Query) => ['import', 'list', query] as const,
  one: (id: string) => ['import', id] as const,
  columns: (categoryId: string) => ['import', 'columns', categoryId] as const,
};

/** The example file's address on our server, for a category or none. */
export const importTemplateHref = (categoryId: string) =>
  withQuery(`${MY_IMPORTS_PATH}/template`, { categoryId });

export const useMyImports = (query: Query) =>
  useQuery({
    queryKey: importKeys.list(query),
    queryFn: () => get<Page<ImportSummary>>(withQuery(MY_IMPORTS_PATH, query)),
  });

export const useMyImport = (id: string) =>
  useQuery({
    queryKey: importKeys.one(id),
    queryFn: () => get<Import>(myImportPath(id)),
  });

export const useImportColumns = (categoryId: string) =>
  useQuery({
    queryKey: importKeys.columns(categoryId),
    queryFn: () => get<ImportColumns>(withQuery(`${MY_IMPORTS_PATH}/columns`, { categoryId })),
    staleTime: COLUMNS_STALE_MS,
  });

export interface ImportUploadInput {
  file: File;
  onProgress: (fraction: number) => void;
  signal: AbortSignal;
}

/** Checks a file; creates nothing. Whatever the answer, the imports are read again. */
export function useUploadImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress, signal }: ImportUploadInput) => {
      const form = new FormData();
      form.append('file', file);
      return upload<Import>(MY_IMPORTS_PATH, form, { onProgress, signal });
    },
    onSuccess: (checked) => queryClient.setQueryData(importKeys.one(checked.id), checked),
    onSettled: () => queryClient.invalidateQueries({ queryKey: importKeys.all }),
  });
}

/** Creates the valid products as drafts. Whatever the answer, the import and products are read again. */
export function useConfirmImport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => send<Import>(`${myImportPath(id)}/confirm`),
    onSuccess: (confirmed) => queryClient.setQueryData(importKeys.one(id), confirmed),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: importKeys.all }),
        queryClient.invalidateQueries({ queryKey: productKeys.lists }),
      ]),
  });
}
