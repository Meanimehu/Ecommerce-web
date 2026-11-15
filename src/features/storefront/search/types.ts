import { z } from 'zod';

/**
 * Backend Area 3a, suggestions while typing (GET /catalogue/suggest), written by hand from the API
 * reference (D3-01). Source: Meanimehu/Ecommerce docs/api/reference/area-3a-catalogue.md, section
 * 1: up to 5 products and up to 3 categories and 3 brands that have visible products.
 */
const NamedSchema = z.object({ id: z.string(), name: z.string(), slug: z.string() });

export const SuggestionsSchema = z.object({
  products: z.array(z.object({ id: z.string(), title: z.string() })),
  categories: z.array(NamedSchema),
  brands: z.array(NamedSchema),
});
export type Suggestions = z.infer<typeof SuggestionsSchema>;
