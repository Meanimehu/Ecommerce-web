import { z } from 'zod';
import { pageOf } from '@/types/common';
import type { components } from '@/types/generated/backend-api';

/**
 * Backend Area 2, Vendors: response shapes written by hand from the API reference (D3-01), and the
 * application forms. Source: Meanimehu/Ecommerce docs/api/reference/area-2-vendors.md, "Shapes used
 * below" and each endpoint. Extra fields are ignored; a missing or wrong required field is a
 * mismatch (D3-02). The enum values are the backend's own words.
 */

export enum VendorStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Approved = 'approved',
  Rejected = 'rejected',
  Suspended = 'suspended',
}

export enum SellerType {
  Individual = 'individual',
  Proprietorship = 'proprietorship',
  Partnership = 'partnership',
  Llp = 'llp',
  PrivateLimited = 'private_limited',
  Other = 'other',
}

export enum DocumentType {
  Pan = 'pan',
  GstCertificate = 'gst_certificate',
  AddressProof = 'address_proof',
  Other = 'other',
}

export enum DocumentStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum AddressType {
  Pickup = 'pickup',
  Return = 'return',
}

/**
 * An admin's decision on a vendor: approve and unsuspend take no body; reject and suspend need a
 * reason.
 */
export enum VendorDecision {
  Approve = 'approve',
  Reject = 'reject',
  Suspend = 'suspend',
  Unsuspend = 'unsuspend',
}

export function isVendorDecision(value: string): value is VendorDecision {
  return (Object.values(VendorDecision) as string[]).includes(value);
}

/** An admin's decision on one document: reject needs a reason. */
export enum DocumentDecision {
  Approve = 'approve',
  Reject = 'reject',
}

export function isDocumentDecision(value: string): value is DocumentDecision {
  return (Object.values(DocumentDecision) as string[]).includes(value);
}

/**
 * Items of the backend's `missing` list that the application screens know (area-2-vendors.md,
 * GET /vendors/me). The backend may list others; they are shown with the backend's own name.
 */
export enum MissingItem {
  SellerType = 'seller_type',
  ContactEmail = 'contact_email',
  PickupAddress = 'pickup_address',
  PanDocument = 'document:pan',
  GstCertificateDocument = 'document:gst_certificate',
}

/** The prefix of a missing document in the backend's lists (`document:pan`). */
export const MISSING_DOCUMENT_PREFIX = 'document:';

/** The four steps of the vendor application, in order (Document 5, section 7.1). */
export enum ApplyStep {
  Details = 'details',
  Address = 'address',
  Documents = 'documents',
  Review = 'review',
}

export const APPLY_STEPS: readonly ApplyStep[] = Object.values(ApplyStep);

export function isApplyStep(value: string | null): value is ApplyStep {
  return value !== null && (APPLY_STEPS as readonly string[]).includes(value);
}

/** Which step fixes each item of the backend's `missing` list. */
export function stepFor(missingItem: string): ApplyStep {
  if (missingItem === MissingItem.SellerType || missingItem === MissingItem.ContactEmail) {
    return ApplyStep.Details;
  }
  if (missingItem === MissingItem.PickupAddress) return ApplyStep.Address;
  return ApplyStep.Documents;
}

/**
 * The application can be changed by its owner only in these statuses (area-2-vendors.md, "How the
 * application works").
 */
export function isEditable(status: VendorStatus): boolean {
  return status === VendorStatus.Draft || status === VendorStatus.Rejected;
}

/** Request bodies, from the generated backend types (D7-02). The backend checks every field. */
export type ApplyVendorBody = components['schemas']['ApplyVendorDto'];
export type UpdateVendorBody = components['schemas']['UpdateVendorDto'];
export type AddVendorAddressBody = components['schemas']['CreateVendorAddressDto'];
export type UpdateVendorAddressBody = components['schemas']['UpdateVendorAddressDto'];
export type SubmitVendorBody = components['schemas']['SubmitVendorDto'];
export type ReasonBody = components['schemas']['ReasonDto'];

export const VENDOR_STATUSES: readonly VendorStatus[] = Object.values(VendorStatus);
export const SELLER_TYPES: readonly SellerType[] = Object.values(SellerType);
export const DOCUMENT_TYPES: readonly DocumentType[] = Object.values(DocumentType);

export function isSellerType(value: string): value is SellerType {
  return (SELLER_TYPES as readonly string[]).includes(value);
}

/** Vendor address. */
export const VendorAddressSchema = z.object({
  id: z.string(),
  type: z.enum(AddressType),
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
  status: z.enum(DocumentStatus),
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
  status: z.enum(VendorStatus),
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
  status: z.enum(VendorStatus),
  submittedAt: z.string().nullable(),
  createdAt: z.string(),
  pendingDocuments: z.number(),
});
export type AdminVendorRow = z.infer<typeof AdminVendorRowSchema>;

export const AdminVendorPageSchema = pageOf(AdminVendorRowSchema);

// ---- Application forms (Document 5, section 7.1). Only cheap, certain checks; the backend decides
// the rest. ----

const optionalText = z.string().trim();

export const VendorDetailsFormSchema = z.object({
  legalName: z.string().trim().min(1, 'validation.required'),
  displayName: z.string().trim().min(1, 'validation.required'),
  gstin: optionalText,
  sellerType: z.string().min(1, 'validation.choose'),
  contactEmail: z.string().trim().min(1, 'validation.required'),
});
export type VendorDetailsFormInput = z.input<typeof VendorDetailsFormSchema>;
export type VendorDetailsFormValues = z.output<typeof VendorDetailsFormSchema>;

const PINCODE_PATTERN = /^\d{6}$/;

export const VendorAddressFormSchema = z.object({
  type: z.enum(AddressType),
  line1: z.string().trim().min(1, 'validation.required'),
  line2: optionalText,
  city: z.string().trim().min(1, 'validation.required'),
  state: z.string().trim().min(1, 'validation.required'),
  pincode: z.string().trim().regex(PINCODE_PATTERN, 'validation.pincodeShape'),
  contactPhone: z.string().trim().min(1, 'validation.required'),
});
export type VendorAddressFormInput = z.input<typeof VendorAddressFormSchema>;
export type VendorAddressFormValues = z.output<typeof VendorAddressFormSchema>;

/**
 * The business profile's details after approval: only the shop name and the contact email can
 * change (area-2-vendors.md, PATCH /vendors/me).
 */
export const ProfileDetailsFormSchema = VendorDetailsFormSchema.pick({
  displayName: true,
  contactEmail: true,
});
export type ProfileDetailsFormInput = z.input<typeof ProfileDetailsFormSchema>;
export type ProfileDetailsFormValues = z.output<typeof ProfileDetailsFormSchema>;
