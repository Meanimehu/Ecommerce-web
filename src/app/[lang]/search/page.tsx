import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/features/layout/components/site-footer';
import { SiteHeader } from '@/features/layout/components/site-header';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { SearchScreen } from '@/features/storefront/product-list/components/search-screen';
import * as productListApi from '@/features/storefront/product-list/server/product-list-api';
import {
  backendFilters,
  categoryEntries,
  ProductSort,
  readListFilters,
  readSearchText,
} from '@/features/storefront/product-list/rules';

/**
 * Search results (Document 5, section 6.1; Document 4, section 5): /{lang}/search?q=…, with the
 * filters and sort in the address, best match first, drawn on the server with the first batch,
 * then "Load more". Never indexed (D4-04). The list answer is kept on our server for 30 seconds
 * (Document 7, section 12).
 */

/** The first batch, and each batch "Load more" adds. */
const PAGE_SIZE = 24;

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: `${getMessages(lang).store.searchTitle} | ${getMessages(lang).site.wordmark}`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const address = await searchParams;
  const text = readSearchText(address.q);
  const filters = readListFilters(address);
  const query = {
    q: text,
    ...backendFilters(filters),
    sort: filters.sort ?? ProductSort.BestMatch,
  };
  const [firstBatch, tree] = await Promise.all([
    text
      ? productListApi
          .listProducts({ ...query, page: 1, limit: PAGE_SIZE })
          .then((answer) => answer.data)
      : null,
    productListApi.getCategoryTree().then(
      (answer) => answer.data,
      () => null,
    ),
  ]);
  return (
    <>
      <SiteHeader lang={lang} searchText={text} />
      <SearchScreen
        lang={lang}
        text={text}
        filters={filters}
        firstBatch={firstBatch}
        query={query}
        categories={tree ? categoryEntries(tree.items) : []}
      />
      <SiteFooter lang={lang} />
    </>
  );
}
