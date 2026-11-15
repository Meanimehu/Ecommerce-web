import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { SiteFooter } from '@/features/layout/components/site-footer';
import { SiteHeader } from '@/features/layout/components/site-header';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { categoryPath } from '@/lib/routes';
import { CategoryScreen } from '@/features/storefront/product-list/components/category-screen';
import * as productListApi from '@/features/storefront/product-list/server/product-list-api';
import {
  backendFilters,
  findInTree,
  isPlainList,
  ProductSort,
  readListFilters,
} from '@/features/storefront/product-list/rules';

/**
 * A category page (Document 5, section 6.1; Document 4, section 5): /{lang}/category/{slug}, the
 * category's products, newest first unless another order is chosen, with the filters in the
 * address, drawn on the server with the first batch, then "Load more". A page that reads its
 * address is drawn on each request; the list answer is kept on our server for 60 seconds, and
 * nothing on the page depends on who is looking (Document 4, section 7; Document 8, Slice 3 notes).
 * Only the plain list is indexed; a filtered or sorted one points to it (Document 4, D4-04).
 */

/** The first batch, and each batch "Load more" adds. */
const PAGE_SIZE = 24;

const loadCategoryTree = cache(() => productListApi.getCategoryTree());

/** The path from the top level down to the category with this slug, or null. */
async function findCategoryPath(slug: string) {
  const tree = (await loadCategoryTree()).data;
  return findInTree(tree.items, (node) => node.slug === slug);
}

type Props = {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const isPlain = isPlainList(readListFilters(await searchParams));
  if (!isLocale(lang)) return {};
  const category = (await findCategoryPath(slug))?.at(-1);
  if (!category) return {};
  return {
    title: `${category.name} | ${getMessages(lang).site.wordmark}`,
    robots: { index: isPlain, follow: true },
    alternates: { canonical: categoryPath(lang, slug) },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { lang, slug } = await params;
  const filters = readListFilters(await searchParams);
  if (!isLocale(lang)) notFound();
  const categoryPathNodes = await findCategoryPath(slug);
  if (!categoryPathNodes?.length) notFound();
  const query = {
    categorySlug: slug,
    ...backendFilters(filters),
    sort: filters.sort ?? ProductSort.Newest,
  };
  const firstBatch = (await productListApi.listProducts({ ...query, page: 1, limit: PAGE_SIZE }))
    .data;
  return (
    <>
      <SiteHeader lang={lang} />
      <CategoryScreen
        lang={lang}
        categoryPathNodes={categoryPathNodes}
        filters={filters}
        firstBatch={firstBatch}
        query={query}
      />
      <SiteFooter lang={lang} />
    </>
  );
}
