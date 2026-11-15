import 'server-only';
import { listBrands } from './product-list-api';
import type { Brand } from '@/features/storefront/product-list/types';

/**
 * A brand page's address holds the backend's brand slug, but the product list filters brands by
 * id and the public brand list has no lookup by slug (Document 4, section 5). So our server keeps
 * one map of slug to brand, built from the whole public brand list (every page, until the total is
 * reached) and kept for 10 minutes (Document 7, section 12). An unknown slug rebuilds the map
 * once, at most once a minute, so repeated unknown slugs cannot hammer the backend; if the slug is
 * still missing, the page is not found.
 */
const MAP_LIFE_MS = 600_000;
const REBUILD_PAUSE_MS = 60_000;
/** The largest page the backend's brand list gives. */
const BRANDS_PER_PAGE = 100;

let kept: { bySlug: Map<string, Brand>; builtAt: number } | null = null;
let building: Promise<Map<string, Brand>> | null = null;

async function build(): Promise<Map<string, Brand>> {
  const bySlug = new Map<string, Brand>();
  for (let page = 1; ; page++) {
    const batch = (await listBrands(page, BRANDS_PER_PAGE)).data;
    for (const brand of batch.items) bySlug.set(brand.slug, brand);
    if (batch.items.length === 0 || page * batch.limit >= batch.total) break;
  }
  kept = { bySlug, builtAt: Date.now() };
  return bySlug;
}

/** One build at a time: requests that arrive together share it. */
function rebuild(): Promise<Map<string, Brand>> {
  building ??= build().finally(() => {
    building = null;
  });
  return building;
}

/** The brand with this slug, or null when the backend has no active brand with it. */
export async function findBrand(slug: string): Promise<Brand | null> {
  const now = Date.now();
  const isFresh = kept !== null && now - kept.builtAt < MAP_LIFE_MS;
  const bySlug = isFresh && kept ? kept.bySlug : await rebuild();
  const brand = bySlug.get(slug);
  if (brand) return brand;
  const mayRebuild = kept !== null && now - kept.builtAt >= REBUILD_PAUSE_MS;
  return mayRebuild ? ((await rebuild()).get(slug) ?? null) : null;
}
