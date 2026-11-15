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

/** GET /catalogue/brands: the active brands, by name, a page at a time. */
export const BrandSchema = z.object({ id: z.string(), name: z.string(), slug: z.string() });
export type Brand = z.infer<typeof BrandSchema>;
export const BrandPageSchema = pageOf(BrandSchema);

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

/**
 * The filter counts of a product list (GET /catalogue/products, `facets`): each value counted with
 * every filter on except its own group's, so a customer sees what another choice would give.
 */
export const FacetsSchema = z.object({
  brands: z.array(
    z.object({ id: z.string(), name: z.string(), slug: z.string(), count: z.number().int() }),
  ),
  sizes: z.array(z.object({ code: z.string(), label: z.string(), count: z.number().int() })),
  colours: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
      hex: z.string().nullable(),
      count: z.number().int(),
    }),
  ),
  price: z.object({
    minPaise: z.number().int().nullable(),
    maxPaise: z.number().int().nullable(),
  }),
});
export type Facets = z.infer<typeof FacetsSchema>;

/** One batch of a product list with its filter counts. */
export const ProductListSchema = ProductCardPageSchema.extend({ facets: FacetsSchema });
export type ProductList = z.infer<typeof ProductListSchema>;
