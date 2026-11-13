'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppError } from '@/lib/errors';
import { get, patch, remove, send, upload } from '@/lib/http';
import type { Page } from '@/types/common';
import type { AddressInput, AdminVendor, AdminVendorRow, Vendor, VendorAddress, VendorDocument } from '@/features/vendor/types';
import { withQuery, type Query } from '@/utils/url';

/**
 * Vendor application and admin vendor review (backend Area 2), for the screens (D-02). Every call goes to our own
 * /api/vendors and /api/admin/vendors endpoints, never to the backend (D3-03). After a change the application is read
 * again, so the screen shows what the backend now holds, never a guess (Document 5, section 3).
 */
export const vendorKeys = {
  mine: ['vendor', 'me'] as const,
  list: (query: Query) => ['vendor', 'admin', 'list', query] as const,
  one: (id: string) => ['vendor', 'admin', id] as const,
};

/** The person's own application, or null when they have not applied (VENDOR_NOT_FOUND). */
export function useMyVendor() {
  return useQuery({
    queryKey: vendorKeys.mine,
    queryFn: async () => {
      try {
        return await get<Vendor>('/api/vendors/me');
      } catch (error) {
        if (error instanceof AppError && error.code === 'VENDOR_NOT_FOUND') return null;
        throw error;
      }
    },
    staleTime: 0,
  });
}

/** Changes to the own application; each one reloads the application afterwards, whatever the outcome. */
function useVendorChange<TInput, TResult>(run: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: run, onSettled: () => queryClient.invalidateQueries({ queryKey: vendorKeys.mine }) });
}

export const useApply = () => useVendorChange((body: Record<string, unknown>) => send<Vendor>('/api/vendors/apply', body));
export const useUpdateVendor = () => useVendorChange((body: Record<string, unknown>) => patch<Vendor>('/api/vendors/me', body));
export const useSubmitVendor = () => useVendorChange((termsVersion: string) => send<Vendor>('/api/vendors/me/submit', { termsVersion }));

export const useSaveAddress = () =>
  useVendorChange(({ id, values }: { id?: string; values: Record<string, unknown> }) =>
    id ? patch<VendorAddress>(`/api/vendors/me/addresses/${encodeURIComponent(id)}`, values) : send<VendorAddress>('/api/vendors/me/addresses', values),
  );
export const useRemoveAddress = () => useVendorChange((id: string) => remove(`/api/vendors/me/addresses/${encodeURIComponent(id)}`));
export const useRemoveDocument = () => useVendorChange((id: string) => remove(`/api/vendors/me/documents/${encodeURIComponent(id)}`));

export const useUploadDocument = () =>
  useVendorChange(({ type, file, onProgress, signal }: { type: string; file: File; onProgress: (fraction: number) => void; signal: AbortSignal }) => {
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    return upload<VendorDocument>('/api/vendors/me/documents', form, { onProgress, signal });
  });

/** The address of a document for opening it (a plain link: the browser sends the login cookie). */
export const myDocumentHref = (id: string) => `/api/vendors/me/documents/${encodeURIComponent(id)}/file`;

/** The address form's values as the backend takes them: line2 left out when empty. */
export function addressBody(values: AddressInput): Record<string, unknown> {
  const { line2, ...rest } = values;
  return line2?.trim() ? { ...rest, line2: line2.trim() } : rest;
}

// ---- Admin review ----

export function useVendorList(query: Query) {
  return useQuery({ queryKey: vendorKeys.list(query), queryFn: () => get<Page<AdminVendorRow>>(withQuery('/api/admin/vendors', query)), staleTime: 30_000 });
}

export function useVendor(id: string) {
  return useQuery({ queryKey: vendorKeys.one(id), queryFn: () => get<AdminVendor>(`/api/admin/vendors/${encodeURIComponent(id)}`), staleTime: 0 });
}

/** A decision on a vendor or one of its documents; the vendor and the lists are read again afterwards. */
export function useVendorDecision(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ decision, docId, reason }: { decision: string; docId?: string; reason?: string }) => {
      const base = `/api/admin/vendors/${encodeURIComponent(id)}`;
      const path = docId ? `${base}/documents/${encodeURIComponent(docId)}/${decision}` : `${base}/${decision}`;
      return send<unknown>(path, reason === undefined ? {} : { reason });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'admin'] }),
  });
}

export const vendorDocumentHref = (id: string, docId: string) =>
  `/api/admin/vendors/${encodeURIComponent(id)}/documents/${encodeURIComponent(docId)}/file`;
