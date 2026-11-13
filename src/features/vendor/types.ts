import { z } from 'zod';
import { pageOf } from '@/types/common';

/**
 * Backend Area 2, Vendors: response shapes written by hand from the API reference (D3-01), and the application forms.
 * Source: Meanimehu/Ecommerce docs/api/reference/area-2-vendors.md, "Shapes used below" and each endpoint.
 * Extra fields are ignored; a missing or wrong required field is a mismatch (D3-02).
 */
export const VENDOR_STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'suspended'] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const SELLER_TYPES = ['individual', 'proprietorship', 'partnership', 'llp', 'private_limited', 'other'] as const;
export const DOCUMENT_TYPES = ['pan', 'gst_certificate', 'address_proof', 'other'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Vendor address. */
export const VendorAddressSchema = z.object({
  id: z.string(),
  type: z.enum(['pickup', 'return']),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  contactPhone: z.string(),
});
export type VendorAddress = z.infer<typeof VendorAddressSchema>;

/** Document (the owner's view; the admin view adds reviewedBy, sha256 and scanStatus). */
export const VendorDocumentSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  rejectReason: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
  fileName: z.string(),
  sizeBytes: z.number(),
  contentType: z.string(),
  onRecord: z.boolean(),
  scanStatus: z.string().optional(),
});
export type VendorDocument = z.infer<typeof VendorDocumentSchema>;

/** Vendor (the applicant's own view: GET /vendors/me and every change to it). */
export const VendorSchema = z.object({
  id: z.string(),
  status: z.enum(VENDOR_STATUSES),
  statusReason: z.string().nullable(),
  legalName: z.string(),
  displayName: z.string(),
  gstin: z.string().nullable(),
  sellerType: z.string().nullable(),
  contactEmail: z.string().nullable(),
  requiredTermsVersion: z.string(),
  termsAcceptedVersion: z.string().nullable(),
  termsAcceptedAt: z.string().nullable(),
  submittedAt: z.string().nullable(),
  approvedAt: z.string().nullable(),
  createdAt: z.string(),
  addresses: z.array(VendorAddressSchema),
  documents: z.array(VendorDocumentSchema),
  missing: z.array(z.string()),
});
export type Vendor = z.infer<typeof VendorSchema>;

/** Admin view of a vendor: GET /admin/vendors/{id} and the decisions. */
export const AdminVendorSchema = VendorSchema.omit({ missing: true }).extend({
  missing: z.array(z.string()).optional(),
  owner: z.object({ id: z.string(), phone: z.string().nullable() }),
});
export type AdminVendor = z.infer<typeof AdminVendorSchema>;

/** One row of GET /admin/vendors. */
export const AdminVendorRowSchema = z.object({
  id: z.string(),
  ownerPhone: z.string().nullable(),
  legalName: z.string(),
  displayName: z.string(),
  gstin: z.string().nullable(),
  status: z.enum(VENDOR_STATUSES),
  submittedAt: z.string().nullable(),
  createdAt: z.string(),
  pendingDocuments: z.number(),
});
export type AdminVendorRow = z.infer<typeof AdminVendorRowSchema>;

export const AdminVendorPageSchema = pageOf(AdminVendorRowSchema);

// ---- Application forms (Document 5, section 7.1). Only cheap, certain checks; the backend decides the rest. ----

const optionalText = z.string().trim();

export const DetailsSchema = z.object({
  legalName: z.string().trim().min(1, 'validation.required'),
  displayName: z.string().trim().min(1, 'validation.required'),
  gstin: optionalText,
  sellerType: z.string().min(1, 'validation.choose'),
  contactEmail: z.string().trim().min(1, 'validation.required'),
});
export type DetailsInput = z.input<typeof DetailsSchema>;

export const AddressSchema = z.object({
  type: z.enum(['pickup', 'return']),
  line1: z.string().trim().min(1, 'validation.required'),
  line2: optionalText,
  city: z.string().trim().min(1, 'validation.required'),
  state: z.string().trim().min(1, 'validation.required'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'validation.pincodeShape'),
  contactPhone: z.string().trim().min(1, 'validation.required'),
});
export type AddressInput = z.input<typeof AddressSchema>;
