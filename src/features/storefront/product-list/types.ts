import { z } from 'zod';
import { pageOf } from '@/types/common';

/**
 * Backend Area 3a, the lists a customer sees: the public category tree and product cards, written
 * by hand from the API reference (D3-01). Source: Meanimehu/Ecommerce
 * docs/api/reference/area-3a-catalogue.md, section 1 (no login; the answer is the same for
 * everyone). Prices are whole paise, GST included. The rules the screens share are in `rules.ts`,
 * which has no Zod, so Zod stays off the public pages.
 */

// ---- What the backend sends ----

/** GET /catalogue/categories: the active categories, nested in display order. */
export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children: CategoryNode[];
};
export const CategoryNodeSchema: z.ZodType<CategoryNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    productCount: z.number().int(),
    children: z.array(CategoryNodeSchema),
  }),
);
export const CategoryTreeSchema = z.object({ items: z.array(CategoryNodeSchema) });
export type CategoryTree = z.infer<typeof CategoryTreeSchema>;

/** A product card (GET /catalogue/products, each item). */
export const ProductCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  brand: z.object({ id: z.string(), name: z.string(), slug: z.string() }).nullable(),
  vendor: z.object({ id: z.string(), displayName: z.string() }),
  pricePaise: z.number().int(),
  mrpPaise: z.number().int(),
  discountPercent: z.number().int(),
  coverUrl: z.string().nullable(),
  thumbUrl: z.string().nullable(),
  inStock: z.boolean(),
  onSale: z.boolean(),
  saleEndsAt: z.string().nullable(),
});
export type ProductCardData = z.infer<typeof ProductCardSchema>;
export const ProductCardPageSchema = pageOf(ProductCardSchema);
