import { expect, type Browser, type Page } from '@playwright/test';
import { KURTA_PHOTO } from './flows';
import { pageAs } from './login';

/**
 * Test set-up only: approved products with stock, made by calling the backend directly (stock
 * screens come in Slice 4). Used by the storefront and cart specs.
 */
const VENDOR_PHONE = process.env.E2E_VENDOR_PHONE ?? '9000000011';
const MODERATOR_PHONE = process.env.E2E_MODERATOR_PHONE ?? '9000000002';
const ADMIN_PHONE = process.env.E2E_ADMIN_PHONE ?? '9000000001';
export const BACKEND = `${process.env.E2E_BACKEND_URL ?? 'http://localhost:3000'}/api/v1`;

const tokenOf = async (page: Page) =>
  (await page.context().cookies()).find((cookie) => cookie.name === '__Host-dhaaga_at')?.value ??
  '';

/** One call to the backend as the logged-in person on `page`. */
export async function backend(
  page: Page,
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const answer = await fetch(`${BACKEND}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${await tokenOf(page)}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  expect(answer.ok, `${method} ${path}: ${answer.status} ${await answer.clone().text()}`).toBe(
    true,
  );
  return answer.status === 204 ? null : answer.json();
}

export type Variant = { sizeCode: string; colourCode: string; pricePaise: number; stock: number };

/**
 * An approved product in Kurtas with these variants and stock, made by the vendor and approved by
 * a moderator, with a brand when one is given. Returns its id.
 */
export async function approvedProduct(
  vendor: Page,
  moderator: Page,
  title: string,
  variants: Variant[],
  brandId?: string,
): Promise<string> {
  const tree = (await (await fetch(`${BACKEND}/catalogue/categories`)).json()) as {
    items: { slug: string; id: string; children: { slug: string; id: string }[] }[];
  };
  const kurtas = tree.items
    .flatMap((node) => [node, ...node.children])
    .find((node) => node.slug === 'kurtas');
  const product = (await backend(vendor, 'POST', '/vendors/me/products', {
    title,
    categoryId: kurtas?.id,
    ...(brandId ? { brandId } : {}),
  })) as { id: string };
  const stamp = String(Date.now()).slice(-7);
  for (const [index, variant] of variants.entries()) {
    const added = (await backend(vendor, 'POST', `/vendors/me/products/${product.id}/variants`, {
      sizeCode: variant.sizeCode,
      colourCode: variant.colourCode,
      sku: `SF${stamp}-${index}`,
      mrpPaise: variant.pricePaise + 50000,
      pricePaise: variant.pricePaise,
    })) as { id: string };
    await setStock(vendor, added.id, variant.stock);
  }
  const photo = new FormData();
  photo.append('file', new Blob([KURTA_PHOTO.buffer], { type: 'image/png' }), 'kurta.png');
  const upload = await fetch(`${BACKEND}/vendors/me/products/${product.id}/images`, {
    method: 'POST',
    headers: { authorization: `Bearer ${await tokenOf(vendor)}` },
    body: photo,
  });
  expect(upload.status).toBe(201);
  await backend(vendor, 'POST', `/vendors/me/products/${product.id}/submit`);
  const review = (await backend(moderator, 'GET', `/moderation/products/${product.id}`)) as {
    seenUpdatedAt: string;
  };
  await backend(moderator, 'POST', `/moderation/products/${product.id}/approve`, {
    seenUpdatedAt: review.seenUpdatedAt,
  });
  return product.id;
}

/** The vendor's quantity for one variant. */
export async function setStock(vendor: Page, variantId: string, quantity: number) {
  await backend(vendor, 'PUT', `/vendors/me/inventory/variants/${variantId}`, { quantity });
}

/** A product's variants as its vendor sees them, in the order they were added. */
export async function variantsOf(vendor: Page, productId: string) {
  const product = (await backend(vendor, 'GET', `/vendors/me/products/${productId}`)) as {
    variants: { id: string; sizeCode: string | null; colourCode: string | null }[];
  };
  return product.variants;
}

/** Two sizes and two colours the product form offers. */
export async function twoSizesAndColours(vendor: Page) {
  const dictionaries = (await backend(vendor, 'GET', '/catalogue/dictionaries')) as {
    sizes: { code: string; label: string }[];
    colours: { code: string; label: string }[];
  };
  const sizes = ['S', 'M'].map((code) => dictionaries.sizes.find((size) => size.code === code));
  const colours = dictionaries.colours.slice(0, 2);
  expect(sizes.every(Boolean) && colours.length === 2).toBe(true);
  return { sizes: sizes as { code: string; label: string }[], colours };
}

/** The vendor and the moderator who make products for the storefront and cart tests. */
export async function staff(browser: Browser) {
  return {
    vendor: await pageAs(browser, VENDOR_PHONE, '/en/vendor'),
    moderator: await pageAs(browser, MODERATOR_PHONE, '/en/admin'),
  };
}

/** The admin, for a marketplace coupon (active at once). */
export async function admin(browser: Browser) {
  return pageAs(browser, ADMIN_PHONE, '/en/admin');
}

/** A new active brand, made by the admin. Returns its id, name and slug. */
export async function newBrand(adminPage: Page, name: string) {
  return (await backend(adminPage, 'POST', '/admin/catalogue/brands', { name })) as {
    id: string;
    name: string;
    slug: string;
  };
}
