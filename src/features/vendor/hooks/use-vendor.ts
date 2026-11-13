'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BackendErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { get, patch, remove, send, upload } from '@/lib/http';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import type {
  AddVendorAddressBody,
  AdminVendor,
  AdminVendorRow,
  ApplyVendorBody,
  DocumentDecision,
  DocumentType,
  UpdateVendorAddressBody,
  UpdateVendorBody,
  Vendor,
  VendorAddress,
  VendorDecision,
  VendorDocument,
} from '@/features/vendor/types';

/**
 * The calls of `vendor`, one hook per call, to our own /api/vendors and /api/admin/vendors
 * endpoints, never to the backend (D3-03). After a change the application is read again, so the
 * screen shows what the backend now holds, never a guess (Document 5, section 3).
 */
const MY_VENDOR_PATH = '/api/vendors/me';
const myAddressPath = (id: string) => `${MY_VENDOR_PATH}/addresses/${encodeURIComponent(id)}`;
const myDocumentPath = (id: string) => `${MY_VENDOR_PATH}/documents/${encodeURIComponent(id)}`;
const adminVendorPath = (id: string) => `/api/admin/vendors/${encodeURIComponent(id)}`;
const adminDocumentPath = (id: string, documentId: string) =>
  `${adminVendorPath(id)}/documents/${encodeURIComponent(documentId)}`;

export const vendorKeys = {
  mine: ['vendor', 'me'] as const,
  /** Every admin read: the lists and each vendor. */
  admin: ['vendor', 'admin'] as const,
  list: (query: Query) => ['vendor', 'admin', 'list', query] as const,
  one: (id: string) => ['vendor', 'admin', id] as const,
};

// ---- The applicant ----

/**
 * The person's own application, or null when they have not applied: VENDOR_NOT_FOUND is the
 * expected answer for someone who has not applied yet, not an error to show (Document 7, 20.9).
 */
export function useMyVendor() {
  return useQuery({
    queryKey: vendorKeys.mine,
    queryFn: async () => {
      try {
        return await get<Vendor>(MY_VENDOR_PATH);
      } catch (caughtError) {
        if (
          caughtError instanceof AppError &&
          caughtError.code === BackendErrorCode.VendorNotFound
        ) {
          return null;
        }
        throw caughtError;
      }
    },
    staleTime: 0,
  });
}

/** Every change to the own application reads it again afterwards, whatever the outcome. */
function useReloadMyVendor() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: vendorKeys.mine });
}

export function useApplyAsVendor() {
  const reloadMyVendor = useReloadMyVendor();
  return useMutation({
    mutationFn: (body: ApplyVendorBody) => send<Vendor>('/api/vendors/apply', body),
    onSettled: reloadMyVendor,
  });
}

export function useUpdateMyVendor() {
  const reloadMyVendor = useReloadMyVendor();
  return useMutation({
    mutationFn: (body: UpdateVendorBody) => patch<Vendor>(MY_VENDOR_PATH, body),
    onSettled: reloadMyVendor,
  });
}

export function useSubmitMyVendor() {
  const reloadMyVendor = useReloadMyVendor();
  return useMutation({
    mutationFn: (termsVersion: string) =>
      send<Vendor>(`${MY_VENDOR_PATH}/submit`, { termsVersion }),
    onSettled: reloadMyVendor,
  });
}

export function useAddVendorAddress() {
  const reloadMyVendor = useReloadMyVendor();
  return useMutation({
    mutationFn: (body: AddVendorAddressBody) =>
      send<VendorAddress>(`${MY_VENDOR_PATH}/addresses`, body),
    onSettled: reloadMyVendor,
  });
}

export function useUpdateVendorAddress() {
  const reloadMyVendor = useReloadMyVendor();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateVendorAddressBody }) =>
      patch<VendorAddress>(myAddressPath(id), body),
    onSettled: reloadMyVendor,
  });
}

export function useRemoveVendorAddress() {
  const reloadMyVendor = useReloadMyVendor();
  return useMutation({
    mutationFn: (id: string) => remove(myAddressPath(id)),
    onSettled: reloadMyVendor,
  });
}

export interface DocumentUploadInput {
  type: DocumentType;
  file: File;
  onProgress: (fraction: number) => void;
  signal: AbortSignal;
}

export function useUploadVendorDocument() {
  const reloadMyVendor = useReloadMyVendor();
  return useMutation({
    mutationFn: ({ type, file, onProgress, signal }: DocumentUploadInput) => {
      const form = new FormData();
      form.append('type', type);
      form.append('file', file);
      return upload<VendorDocument>(`${MY_VENDOR_PATH}/documents`, form, { onProgress, signal });
    },
    onSettled: reloadMyVendor,
  });
}

export function useRemoveVendorDocument() {
  const reloadMyVendor = useReloadMyVendor();
  return useMutation({
    mutationFn: (id: string) => remove(myDocumentPath(id)),
    onSettled: reloadMyVendor,
  });
}

/** The address of the person's own document, for opening it (a plain link sends the cookies). */
export const myDocumentHref = (id: string) => `${myDocumentPath(id)}/file`;

// ---- Admin review ----

export function useVendorList(query: Query) {
  return useQuery({
    queryKey: vendorKeys.list(query),
    queryFn: () => get<Page<AdminVendorRow>>(withQuery('/api/admin/vendors', query)),
    staleTime: 30_000,
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: vendorKeys.one(id),
    queryFn: () => get<AdminVendor>(adminVendorPath(id)),
    staleTime: 0,
  });
}

/** After any decision the vendor and the lists are read again. */
function useReloadAdminVendors() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: vendorKeys.admin });
}

/** The reason goes only with the decisions that need one. */
const reasonBody = (reason: string | undefined) => (reason === undefined ? {} : { reason });

export interface VendorDecisionInput {
  decision: VendorDecision;
  reason?: string;
}

export function useDecideVendor(id: string) {
  const reloadAdminVendors = useReloadAdminVendors();
  return useMutation({
    mutationFn: ({ decision, reason }: VendorDecisionInput) =>
      send<AdminVendor>(`${adminVendorPath(id)}/${decision}`, reasonBody(reason)),
    onSettled: reloadAdminVendors,
  });
}

export interface DocumentDecisionInput {
  documentId: string;
  decision: DocumentDecision;
  reason?: string;
}

export function useReviewVendorDocument(id: string) {
  const reloadAdminVendors = useReloadAdminVendors();
  return useMutation({
    mutationFn: ({ documentId, decision, reason }: DocumentDecisionInput) =>
      send<VendorDocument>(`${adminDocumentPath(id, documentId)}/${decision}`, reasonBody(reason)),
    onSettled: reloadAdminVendors,
  });
}

/** The address of a vendor's document for review, for opening it. */
export const vendorDocumentHref = (id: string, documentId: string) =>
  `${adminDocumentPath(id, documentId)}/file`;
