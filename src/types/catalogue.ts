import { z } from 'zod';
import { pageOf } from './common';

/**
 * Backend Area 3a, the storefront part: the public category tree, product cards and one product, written by hand from
 * the API reference (D3-01). Source: Meanimehu/Ecommerce docs/api/reference/area-3a-catalogue.md, section 1. The admin
 * lists are in src/features/catalogue/types.ts; this part moves with the storefront (Document 7, 20.13, step 8).
 */

// ---- Storefront (section 1, no login) ----

/** GET /catalogue/categories: the active categories, nested in display order. */
export type CategoryNode = { id: string; name: string; slug: string; productCount: number; children: CategoryNode[] };
export const CategoryNodeSchema: z.ZodType<CategoryNode> = z.lazy(() =>
  z.object({ id: z.string(), name: z.string(), slug: z.string(), productCount: z.number().int(), children: z.array(CategoryNodeSchema) }),
);
export const CategoryTreeSchema = z.object({ items: z.array(CategoryNodeSchema) });

/** The node with this id or slug, and the path from the top level down to it. */
export function findInTree(nodes: readonly CategoryNode[], match: (node: CategoryNode) => boolean, path: CategoryNode[] = []): CategoryNode[] | null {
  for (const node of nodes) {
    if (match(node)) return [...path, node];
    const found = findInTree(node.children, match, [...path, node]);
    if (found) return found;
  }
  return null;
}

/** A product card (GET /catalogue/products, each item). Prices are whole paise, GST included. */
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
export type ProductCard = z.infer<typeof ProductCardSchema>;
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

const crumb = z.object({ id: z.string(), name: z.string(), slug: z.string() });
export const ProductDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  brand: z.object({ id: z.string(), name: z.string(), slug: z.string() }).nullable(),
  vendor: z.object({ id: z.string(), displayName: z.string() }),
  category: crumb,
  categoryPath: z.array(crumb),
  attributes: z.array(z.object({ key: z.string(), label: z.string(), value: z.union([z.string(), z.number()]) })),
  pricePaise: z.number().int(),
  mrpPaise: z.number().int(),
  discountPercent: z.number().int(),
  images: z.array(z.object({ altText: z.string().nullable(), urls: z.object({ large: z.string(), medium: z.string(), thumb: z.string() }) })),
  variants: z.array(PublicVariantSchema),
  inStock: z.boolean(),
  lowStock: z.boolean(),
  onSale: z.boolean(),
  saleEndsAt: z.string().nullable(),
});
export type ProductDetail = z.infer<typeof ProductDetailSchema>;

/**
 * The readable part of a product address (D4-02): from the title, lower-case Latin letters and digits joined by
 * hyphens. It is only for people and search engines; the id is what is looked up.
 */
export function productSlug(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return slug || 'product';
}

export const productPath = (lang: string, id: string, title: string) => `/${lang}/p/${id}/${productSlug(title)}`;
