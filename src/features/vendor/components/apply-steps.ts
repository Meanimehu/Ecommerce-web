/** The four steps of the vendor application, in order (Document 5, section 7.1). */
export const STEP_KEYS = ['details', 'address', 'documents', 'review'] as const;
export type StepKey = (typeof STEP_KEYS)[number];

/** Which step fixes each item of the backend's `missing` list (area-2-vendors.md, GET /vendors/me). */
export function stepFor(missing: string): StepKey {
  if (missing === 'seller_type' || missing === 'contact_email') return 'details';
  if (missing === 'pickup_address') return 'address';
  return 'documents';
}
