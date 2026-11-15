import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { getMessages, sectionMessages } from '@/lib/messages';
import { MessagesProvider } from '@/lib/messages-context';
import { brandPath, homePath } from '@/lib/routes';
import type { Query } from '@/utils/url';
import {
  FilterGroup,
  LIST_SORTS,
  type ListFilters,
} from '@/features/storefront/product-list/rules';
import type { Brand, ProductList } from '@/features/storefront/product-list/types';
import { FilteredList } from './filtered-list';

/** The brand page has no brand filter (approved Stage 5 screens). */
const HIDDEN_GROUPS = [FilterGroup.Brand] as const;

/**
 * A brand page's content (Document 5, section 6.1; approved Stage 5 screens): the same layout as a
 * category page, with the brand's name as the heading, how many products it has, and its products
 * with filters (no brand filter), sort and "Load more". Drawn on the server for the filters in the
 * address.
 */
export function BrandScreen({
  lang,
  brand,
  filters,
  firstBatch,
  query,
}: {
  lang: Locale;
  brand: Brand;
  filters: ListFilters;
  firstBatch: ProductList;
  query: Query;
}) {
  const messages = getMessages(lang);
  const storeMessages = messages.store;
  const crumbs = [{ label: storeMessages.home, href: homePath(lang) }, { label: brand.name }];
  const countText = firstBatch.total === 1 ? storeMessages.productsOne : storeMessages.productsMany;

  return (
    <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
      <div className="grid gap-1">
        <h1 className="type-h1 text-ink">{brand.name}</h1>
        <p className="text-ink-2">{fill(countText, { count: firstBatch.total })}</p>
      </div>
      <MessagesProvider messages={sectionMessages(lang, ['store'])}>
        <FilteredList
          lang={lang}
          path={brandPath(lang, brand.slug)}
          filters={filters}
          firstBatch={firstBatch}
          query={query}
          sorts={LIST_SORTS}
          hiddenGroups={HIDDEN_GROUPS}
          emptyText={storeMessages.brandNoProducts}
        />
      </MessagesProvider>
    </main>
  );
}
