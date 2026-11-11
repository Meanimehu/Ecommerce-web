import 'server-only';
import { AdminVendorPageSchema, AdminVendorSchema, VendorAddressSchema, VendorDocumentSchema, VendorSchema } from '@/types/vendor';
import type { Query } from '@/utils/url';
import { callBackend, openBackendFile, type UploadBody } from './client';

/**
 * Backend Area 2, Vendors (area-2-vendors.md): the application by its owner, and the admin review. One function per
 * backend operation. Bodies are passed as the browser sent them; the backend checks every field and refuses unknown
 * ones (area-2-vendors.md, "Errors that can happen on any call").
 */
type Body = Record<string, unknown>;

// ---- The applicant (section 1) ----

export const applyAsVendor = (token: string, body: Body) =>
  callBackend({ method: 'POST', path: '/vendors/apply', kind: 'save', token, body, schema: VendorSchema });

export const getMyVendor = (token: string) => callBackend({ method: 'GET', path: '/vendors/me', kind: 'view', token, schema: VendorSchema });

export const updateMyVendor = (token: string, body: Body) =>
  callBackend({ method: 'PATCH', path: '/vendors/me', kind: 'save', token, body, schema: VendorSchema });

export const addVendorAddress = (token: string, body: Body) =>
  callBackend({ method: 'POST', path: '/vendors/me/addresses', kind: 'save', token, body, schema: VendorAddressSchema });

export const updateVendorAddress = (token: string, id: string, body: Body) =>
  callBackend({ method: 'PATCH', path: `/vendors/me/addresses/${encodeURIComponent(id)}`, kind: 'save', token, body, schema: VendorAddressSchema });

export const removeVendorAddress = (token: string, id: string) =>
  callBackend({ method: 'DELETE', path: `/vendors/me/addresses/${encodeURIComponent(id)}`, kind: 'save', token, schema: null });

export const uploadVendorDocument = (token: string, upload: UploadBody) =>
  callBackend({ method: 'POST', path: '/vendors/me/documents', kind: 'upload', token, upload, schema: VendorDocumentSchema });

export const removeVendorDocument = (token: string, id: string) =>
  callBackend({ method: 'DELETE', path: `/vendors/me/documents/${encodeURIComponent(id)}`, kind: 'save', token, schema: null });

export const openMyVendorDocument = (token: string, id: string) => openBackendFile({ path: `/vendors/me/documents/${encodeURIComponent(id)}/file`, token });

export const submitMyVendor = (token: string, body: Body) =>
  callBackend({ method: 'POST', path: '/vendors/me/submit', kind: 'save', token, body, schema: VendorSchema });

// ---- Admin review (section 2) ----

export const listVendors = (token: string, query: Query) =>
  callBackend({ method: 'GET', path: '/admin/vendors', query, kind: 'view', token, schema: AdminVendorPageSchema });

export const getVendor = (token: string, id: string) =>
  callBackend({ method: 'GET', path: `/admin/vendors/${encodeURIComponent(id)}`, kind: 'view', token, schema: AdminVendorSchema });

export const openVendorDocument = (token: string, id: string, docId: string) =>
  openBackendFile({ path: `/admin/vendors/${encodeURIComponent(id)}/documents/${encodeURIComponent(docId)}/file`, token });

export const reviewVendorDocument = (token: string, id: string, docId: string, decision: 'approve' | 'reject', body?: Body) =>
  callBackend({
    method: 'POST',
    path: `/admin/vendors/${encodeURIComponent(id)}/documents/${encodeURIComponent(docId)}/${decision}`,
    kind: 'save',
    token,
    body: decision === 'reject' ? body : undefined,
    schema: VendorDocumentSchema,
  });

/** approve and unsuspend take no body; reject and suspend need a reason. */
export const VENDOR_DECISIONS = ['approve', 'reject', 'suspend', 'unsuspend'] as const;
export type VendorDecision = (typeof VENDOR_DECISIONS)[number];

export const decideVendor = (token: string, id: string, decision: VendorDecision, body?: Body) =>
  callBackend({
    method: 'POST',
    path: `/admin/vendors/${encodeURIComponent(id)}/${decision}`,
    kind: 'save',
    token,
    body: decision === 'reject' || decision === 'suspend' ? body : undefined,
    schema: AdminVendorSchema,
  });
