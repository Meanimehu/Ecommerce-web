import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { SiteHeader } from '@/features/layout/components/site-header';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { categoryPath } from '@/lib/routes';
import { CategoryScreen } from '@/features/storefront/product-list/components/category-screen';
import * as productListApi from '@/features/storefront/product-list/server/product-list-api';
import { findInTree, ProductSort } from '@/features/storefront/product-list/rules';

/**
 * A category page (Document 5, section 6.1; Document 4, section 5): /{lang}/category/{slug}, the
 * category's products, newest first, drawn on the server with the first batch, then "Load more".
 * Nothing on it depends on who is looking, so it may be kept and shared for 60 seconds (Document
 * 4, section 7; Document 7, section 12). Filters and sort come in Slice 3.
 */
export const revalidate = 60;

/** The first batch, and each batch "Load more" adds. */
const PAGE_SIZE = 24;

const loadCategoryTree = cache(() => productListApi.getCategoryTree());

/** The path from the top level down to the category with this slug, or null. */
async function findCategoryPath(slug: string) {
  const tree = (await loadCategoryTree()).data;
  return findInTree(tree.items, (node) => node.slug === slug);
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const category = (await findCategoryPath(slug))?.at(-1);
  if (!category) return {};
  return {
    title: `${category.name} | ${getMessages(lang).site.wordmark}`,
    robots: { index: true, follow: true },
    alternates: { canonical: categoryPath(lang, slug) },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const categoryPathNodes = await findCategoryPath(slug);
  if (!categoryPathNodes?.length) notFound();
  const query = { categorySlug: slug, sort: ProductSort.Newest };
  const firstBatch = (await productListApi.listProducts({ ...query, page: 1, limit: PAGE_SIZE }))
    .data;
  return (
    <>
      <SiteHeader lang={lang} />
      <CategoryScreen
        lang={lang}
        categoryPathNodes={categoryPathNodes}
        firstBatch={firstBatch}
        query={query}
      />
    </>
  );
}
