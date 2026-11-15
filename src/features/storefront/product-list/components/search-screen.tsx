import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { getMessages, sectionMessages } from '@/lib/messages';
import { MessagesProvider } from '@/lib/messages-context';
import { categoryPath, searchPath } from '@/lib/routes';
import type { Query } from '@/utils/url';
import { SEARCH_SORTS, type ListFilters } from '@/features/storefront/product-list/rules';
import type { CategoryNode, ProductList } from '@/features/storefront/product-list/types';
import { FilteredList } from './filtered-list';

/**
 * The search results (Document 5, section 6.1; approved Stage 5 screens): "Results for “kurta”", how
 * many, and the same grid, filters and sort as a category page, best match first. When nothing
 * matches it says so, suggests checking the spelling or clearing a filter, and links to categories.
 * With no search text it asks for some. Drawn on the server for the address.
 */
export function SearchScreen({
  lang,
  text,
  filters,
  firstBatch,
  query,
  categories,
}: {
  lang: Locale;
  /** The search text; '' when there is none. */
  text: string;
  filters: ListFilters;
  firstBatch: ProductList | null;
  query: Query;
  /** Categories to offer when nothing matches. */
  categories: CategoryNode[];
}) {
  const messages = getMessages(lang);
  const storeMessages = messages.store;
  const countText =
    firstBatch?.total === 1 ? storeMessages.productsOne : storeMessages.productsMany;
  const browseLinks = categories.length ? (
    <ul className="flex flex-wrap justify-center gap-2">
      {categories.map((category) => (
        <li key={category.id}>
          <a
            href={categoryPath(lang, category.slug)}
            className="inline-flex min-h-11 items-center rounded-2 border border-control bg-surface px-3 type-small text-ink no-underline hover:border-ink"
          >
            {category.name}
          </a>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-1">
        <h1 className="type-h1 text-ink">
          {text ? fill(storeMessages.resultsFor, { text }) : storeMessages.searchTitle}
        </h1>
        {firstBatch ? (
          <p className="text-ink-2">{fill(countText, { count: firstBatch.total })}</p>
        ) : null}
      </div>
      {firstBatch ? (
        <MessagesProvider messages={sectionMessages(lang, ['store'])}>
          <FilteredList
            lang={lang}
            path={searchPath(lang)}
            fixedQuery={{ q: text }}
            filters={filters}
            firstBatch={firstBatch}
            query={query}
            sorts={SEARCH_SORTS}
            emptyText={`${fill(storeMessages.nothingMatches, { text })} ${storeMessages.nothingMatchesText}`}
            browseLinks={browseLinks}
          />
        </MessagesProvider>
      ) : (
        <p className="text-ink-2">{storeMessages.searchPrompt}</p>
      )}
    </main>
  );
}
