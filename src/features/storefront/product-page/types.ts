import { z } from 'zod';

/**
 * Backend Area 3a, one product as a customer sees it (GET /catalogue/products/{id}), written by
 * hand from the API reference (D3-01). Source: Meanimehu/Ecommerce
 * docs/api/reference/area-3a-catalogue.md, section 1 (no login; the answer is the same for
 * everyone). Prices are whole paise, GST included. The rules the screens share are in `rules.ts`,
 * which has no Zod, so Zod stays off the public pages.
 */

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
