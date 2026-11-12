import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import * as catalogueApi from '@/api/catalogue';
import { ProductGrid } from '@/components/catalogue/load-more';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { SiteHeader } from '@/components/common/site-header';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { findInTree } from '@/types/catalogue';
import { fill } from '@/lib/errors';

/**
 * A category page (Document 5, section 6.1; Document 4, section 5): the category's products, newest first, rendered on
 * the server with the first batch, then "Load more". Nothing on it depends on who is looking, so it may be kept and
 * shared for a while (Document 4, section 7; Document 7, section 12: 60 seconds). Filters and sort come in Slice 3.
 */
export const revalidate = 60;
const PAGE_SIZE = 24;

const categoryTree = cache(() => catalogueApi.getCategoryTree());

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const path = findInTree((await categoryTree()).data.items, (node) => node.slug === slug);
  const category = path?.at(-1);
  if (!category) return {};
  return { title: `${category.name} | ${getMessages(lang).site.wordmark}`, robots: { index: true, follow: true }, alternates: { canonical: `/${lang}/c/${slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  const path = findInTree((await categoryTree()).data.items, (node) => node.slug === slug);
  const category = path?.at(-1);
  if (!path || !category) notFound();
  const query = { categorySlug: slug, sort: 'newest' };
  const { data: first } = await catalogueApi.listProducts({ ...query, page: 1, limit: PAGE_SIZE });
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumbs label={t.nav.breadcrumbs} items={[{ label: t.store.home, href: `/${lang}` }, ...path.map((node, index) => ({ label: node.name, href: index < path.length - 1 ? `/${lang}/c/${node.slug}` : undefined }))]} />
        <div className="grid gap-1">
          <h1 className="type-h1 text-ink">{category.name}</h1>
          <p className="text-ink-2">{fill(first.total === 1 ? t.store.productsOne : t.store.productsMany, { count: first.total })}</p>
        </div>
        {category.children.length ? (
          <nav aria-label={t.store.subcategories}>
            <ul className="flex flex-wrap gap-2">
              {category.children.map((child) => (
                <li key={child.id}>
                  <a href={`/${lang}/c/${child.slug}`} className="inline-flex min-h-11 items-center rounded-2 border border-control bg-surface px-3 type-small text-ink no-underline hover:border-ink">
                    {child.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {first.items.length ? (
          <ProductGrid lang={lang} first={first} query={query} />
        ) : (
          <p className="rounded-1 border border-dashed border-control bg-surface px-6 py-10 text-center text-ink-2">{t.store.noProducts}</p>
        )}
      </main>
    </>
  );
}
