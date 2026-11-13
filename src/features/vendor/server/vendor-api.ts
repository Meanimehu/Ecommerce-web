import 'server-only';
import { callBackend, openBackendFile, type UploadBody } from '@/api/client';
import type { Query } from '@/utils/url';
import {
  AdminVendorPageSchema,
  AdminVendorSchema,
  DocumentDecision,
  VendorAddressSchema,
  VendorDecision,
  VendorDocumentSchema,
  VendorSchema,
  type AddVendorAddressBody,
  type ApplyVendorBody,
  type ReasonBody,
  type SubmitVendorBody,
  type UpdateVendorAddressBody,
  type UpdateVendorBody,
} from '@/features/vendor/types';

/**
 * Backend Area 2, Vendors (area-2-vendors.md): the application by its owner, and the admin review.
 * One function per backend operation. Bodies are passed on as the browser sent them; the backend
 * checks every field and refuses unknown ones (area-2-vendors.md, "Errors that can happen on any
 * call").
 */

const addressPath = (id: string) => `/vendors/me/addresses/${encodeURIComponent(id)}`;
const adminVendorPath = (id: string) => `/admin/vendors/${encodeURIComponent(id)}`;
const adminDocumentPath = (id: string, documentId: string) =>
  `${adminVendorPath(id)}/documents/${encodeURIComponent(documentId)}`;

/** The decisions that need a reason in their body. */
const DECISIONS_WITH_REASON: ReadonlySet<VendorDecision> = new Set([
  VendorDecision.Reject,
  VendorDecision.Suspend,
]);

// ---- The applicant (section 1) ----

export const applyAsVendor = (token: string, body: ApplyVendorBody) =>
  callBackend({
    method: 'POST',
    path: '/vendors/apply',
    kind: 'save',
    token,
    body,
    schema: VendorSchema,
  });

export const getMyVendor = (token: string) =>
  callBackend({ method: 'GET', path: '/vendors/me', kind: 'view', token, schema: VendorSchema });

export const updateMyVendor = (token: string, body: UpdateVendorBody) =>
  callBackend({
    method: 'PATCH',
    path: '/vendors/me',
    kind: 'save',
    token,
    body,
    schema: VendorSchema,
  });

export const addVendorAddress = (token: string, body: AddVendorAddressBody) =>
  callBackend({
    method: 'POST',
    path: '/vendors/me/addresses',
    kind: 'save',
    token,
    body,
    schema: VendorAddressSchema,
  });

export const updateVendorAddress = (token: string, id: string, body: UpdateVendorAddressBody) =>
  callBackend({
    method: 'PATCH',
    path: addressPath(id),
    kind: 'save',
    token,
    body,
    schema: VendorAddressSchema,
  });

export const removeVendorAddress = (token: string, id: string) =>
  callBackend({ method: 'DELETE', path: addressPath(id), kind: 'save', token, schema: null });

export const uploadVendorDocument = (token: string, upload: UploadBody) =>
  callBackend({
    method: 'POST',
    path: '/vendors/me/documents',
    kind: 'upload',
    token,
    upload,
    schema: VendorDocumentSchema,
  });

export const removeVendorDocument = (token: string, id: string) =>
  callBackend({
    method: 'DELETE',
    path: `/vendors/me/documents/${encodeURIComponent(id)}`,
    kind: 'save',
    token,
    schema: null,
  });

export const openMyVendorDocument = (token: string, id: string) =>
  openBackendFile({ path: `/vendors/me/documents/${encodeURIComponent(id)}/file`, token });

export const submitMyVendor = (token: string, body: SubmitVendorBody) =>
  callBackend({
    method: 'POST',
    path: '/vendors/me/submit',
    kind: 'save',
    token,
    body,
    schema: VendorSchema,
  });

// ---- Admin review (section 2) ----

export const listVendors = (token: string, query: Query) =>
  callBackend({
    method: 'GET',
    path: '/admin/vendors',
    query,
    kind: 'view',
    token,
    schema: AdminVendorPageSchema,
  });

export const getVendor = (token: string, id: string) =>
  callBackend({
    method: 'GET',
    path: adminVendorPath(id),
    kind: 'view',
    token,
    schema: AdminVendorSchema,
  });

export const openVendorDocument = (token: string, id: string, documentId: string) =>
  openBackendFile({ path: `${adminDocumentPath(id, documentId)}/file`, token });

export const reviewVendorDocument = (
  token: string,
  id: string,
  documentId: string,
  decision: DocumentDecision,
  body: Partial<ReasonBody>,
) =>
  callBackend({
    method: 'POST',
    path: `${adminDocumentPath(id, documentId)}/${decision}`,
    kind: 'save',
    token,
    body: decision === DocumentDecision.Reject ? body : undefined,
    schema: VendorDocumentSchema,
  });

export const decideVendor = (
  token: string,
  id: string,
  decision: VendorDecision,
  body: Partial<ReasonBody>,
) =>
  callBackend({
    method: 'POST',
    path: `${adminVendorPath(id)}/${decision}`,
    kind: 'save',
    token,
    body: DECISIONS_WITH_REASON.has(decision) ? body : undefined,
    schema: AdminVendorSchema,
  });
