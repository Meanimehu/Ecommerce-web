'use client';

import { LoadingBlock, PartError } from '@/components/common/load-states';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { brandPath, categoryPath } from '@/lib/routes';
import {
  useBrands,
  useCategoryTree,
} from '@/features/storefront/product-list/hooks/use-product-list';
import { categoryEntries } from '@/features/storefront/product-list/rules';
import type { Brand, CategoryTree } from '@/features/storefront/product-list/types';

const TILE_CLASS =
  'flex min-h-12 items-center rounded-1 border border-line bg-surface px-4 py-3 text-ink no-underline hover:border-ink';

/**
 * The home page's entry points (Document 5, D5-12; Document 6, 7.4): "Shop by category" and
 * "Brands", as names only, because the backend sends a name and a slug and no image. Each part reads
 * again with "Try again" if it failed, inside that part only (Document 5, section 3). The brands
 * are not shown on compact screens, as in the approved Stage 5 screens; up to 100 are listed
 * (Document 8, Slice 3 notes).
 */
export function CatalogueEntries({
  lang,
  drawnTree,
  drawnBrands,
  brandLimit,
}: {
  lang: Locale;
  drawnTree: CategoryTree | null;
  drawnBrands: Brand[] | null;
  brandLimit: number;
}) {
  const messages = useMessages();
  const storeMessages = messages.store;
  const tree = useCategoryTree(drawnTree);
  const brands = useBrands(drawnBrands, brandLimit);
  const categories = tree.isSuccess ? categoryEntries(tree.data.items) : [];

  return (
    <>
      <section aria-labelledby="shop-by-category" className="grid gap-4">
        <h2 id="shop-by-category" className="type-h2 text-ink">
          {storeMessages.shopByCategory}
        </h2>
        {tree.isPending ? <LoadingBlock messages={messages} lines={2} /> : null}
        {tree.isError ? (
          <PartError
            error={tree.error}
            title={storeMessages.categoriesError}
            onRetry={() => void tree.refetch()}
            messages={messages}
          />
        ) : null}
        {categories.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((category) => (
              <li key={category.id}>
                <a href={categoryPath(lang, category.slug)} className={TILE_CLASS}>
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      {brands.isSuccess && !brands.data.length ? null : (
        <section aria-labelledby="brands" className="grid gap-4 max-sm:hidden">
          <h2 id="brands" className="type-h2 text-ink">
            {storeMessages.brands}
          </h2>
          {brands.isPending ? <LoadingBlock messages={messages} lines={2} /> : null}
          {brands.isError ? (
            <PartError
              error={brands.error}
              title={storeMessages.brandsError}
              onRetry={() => void brands.refetch()}
              messages={messages}
            />
          ) : null}
          {brands.isSuccess ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {brands.data.map((brand) => (
                <li key={brand.id}>
                  <a href={brandPath(lang, brand.slug)} className={TILE_CLASS}>
                    {brand.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}
    </>
  );
}
