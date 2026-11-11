/** The five steps of the product form, in order (Document 5, section 7.3). */
export const PRODUCT_STEPS = ['basics', 'attributes', 'variants', 'photos', 'review'] as const;
export type ProductStep = (typeof PRODUCT_STEPS)[number];

/** Which step fixes each item of the backend's `missing` list (area-3b-products.md, "What a product needs"). */
export function productStepFor(missing: string): ProductStep {
  if (missing === 'attributes') return 'attributes';
  if (missing === 'variant') return 'variants';
  if (missing === 'image') return 'photos';
  return 'basics';
}
