import { z } from 'zod';
import { pageOf } from '@/types/common';

/**
 * Backend Area 3a, the storefront part: the public category tree, product cards and one product,
 * written by hand from the API reference (D3-01). Source: Meanimehu/Ecommerce docs/api/reference/area-3a-catalogue.md, section 1 (no login; the
 * answer is the same for everyone). Prices are whole paise, GST included. The rules the screens
 * share are in `rules.ts`, which has no Zod, so Zod stays off the public pages.
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

/** GET /catalogue/products/{id}: one visible product. */
export const PublicVariantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  size: z.object({ code: z.string(), label: z.string() }).nullable(),
  colour: z.object({ code: z.string(), label: z.string(), hex: z.string().nullable() }).nullable(),
  pricePaise: z.number().int(),
  mrpPaise: z.number().int(),
  discountPercent: z.number().int(),
  inStock: z.boolean(),
  lowStock: z.boolean(),
  onSale: z.boolean(),
  saleEndsAt: z.string().nullable(),
});
export type PublicVariant = z.infer<typeof PublicVariantSchema>;
export type VariantSize = NonNullable<PublicVariant['size']>;
export type VariantColour = NonNullable<PublicVariant['colour']>;

const CategoryCrumbSchema = z.object({ id: z.string(), name: z.string(), slug: z.string() });
export type CategoryCrumb = z.infer<typeof CategoryCrumbSchema>;

export const ProductDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  brand: z.object({ id: z.string(), name: z.string(), slug: z.string() }).nullable(),
  vendor: z.object({ id: z.string(), displayName: z.string() }),
  category: CategoryCrumbSchema,
  categoryPath: z.array(CategoryCrumbSchema),
  attributes: z.array(
    z.object({ key: z.string(), label: z.string(), value: z.union([z.string(), z.number()]) }),
  ),
  pricePaise: z.number().int(),
  mrpPaise: z.number().int(),
  discountPercent: z.number().int(),
  images: z.array(
    z.object({
      altText: z.string().nullable(),
      urls: z.object({ large: z.string(), medium: z.string(), thumb: z.string() }),
    }),
  ),
  variants: z.array(PublicVariantSchema),
  inStock: z.boolean(),
  lowStock: z.boolean(),
  onSale: z.boolean(),
  saleEndsAt: z.string().nullable(),
});
export type ProductDetail = z.infer<typeof ProductDetailSchema>;
export type ProductImage = ProductDetail['images'][number];
