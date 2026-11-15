import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { SiteHeader } from '@/features/layout/components/site-header';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { brandPath } from '@/lib/routes';
import { BrandScreen } from '@/features/storefront/product-list/components/brand-screen';
import { findBrand } from '@/features/storefront/product-list/server/brand-slugs';
import * as productListApi from '@/features/storefront/product-list/server/product-list-api';
import {
  backendFilters,
  isPlainList,
  ProductSort,
  readListFilters,
} from '@/features/storefront/product-list/rules';

/**
 * A brand page (Document 5, section 6.1; Document 4, section 5): /{lang}/brand/{slug}, the brand's
 * products with filters and sort in the address, drawn on the server with the first batch, then
 * "Load more". The slug is the backend's brand slug, turned into its id by our server's brand map
 * (`brand-slugs.ts`); an unknown slug is a real 404. Like a category page it is drawn on each
 * request, with the list answer kept for 60 seconds, and only the plain list is indexed (D4-04).
 */

/** The first batch, and each batch "Load more" adds. */
const PAGE_SIZE = 24;

const loadBrand = cache((slug: string) => findBrand(slug));

type Props = {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const brand = await loadBrand(slug);
  if (!brand) return {};
  const isPlain = isPlainList(readListFilters(await searchParams));
  return {
    title: `${brand.name} | ${getMessages(lang).site.wordmark}`,
    robots: { index: isPlain, follow: true },
    alternates: { canonical: brandPath(lang, slug) },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const brand = await loadBrand(slug);
  if (!brand) notFound();
  // The brand is the page itself, so a brand filter in the address is not used.
  const filters = { ...readListFilters(await searchParams), brandIds: [] };
  const query = {
    ...backendFilters(filters),
    brandId: brand.id,
    sort: filters.sort ?? ProductSort.Newest,
  };
  const firstBatch = (await productListApi.listProducts({ ...query, page: 1, limit: PAGE_SIZE }))
    .data;
  return (
    <>
      <SiteHeader lang={lang} />
      <BrandScreen
        lang={lang}
        brand={brand}
        filters={filters}
        firstBatch={firstBatch}
        query={query}
      />
    </>
  );
}
