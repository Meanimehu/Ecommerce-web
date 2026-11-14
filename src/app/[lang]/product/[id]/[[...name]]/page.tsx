import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import * as catalogueApi from '@/features/storefront/server/storefront-api';
import { ProductBuy } from '@/features/storefront/components/product-buy';
import { ProductGallery } from '@/features/storefront/components/product-gallery';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { SiteHeader } from '@/components/common/site-header';
import { AppError } from '@/lib/errors';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { productPath, productSlug } from '@/features/storefront/types';

/**
 * The product page (Document 5, section 6.2; Document 4, D4-02): /{lang}/product/{id}/{name}. The id is what is looked up;
 * a missing or wrong name part redirects to the full address. A product that is not visible is a real 404. The page
 * holds nothing about who is looking, so it may be kept for 60 seconds; price and stock are read again in the browser
 * before adding to the cart.
 */
export const revalidate = 60;

const loadProduct = cache(async (id: string) => {
  try {
    return (await catalogueApi.getProduct(id)).data;
  } catch (error) {
    if (error instanceof AppError && error.code === 'PRODUCT_NOT_FOUND') return null;
    throw error;
  }
});

type Props = { params: Promise<{ lang: string; id: string; name?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLocale(lang)) return {};
  const product = await loadProduct(id);
  if (!product) return {};
  return {
    title: `${product.title} | ${getMessages(lang).site.wordmark}`,
    description: product.description?.slice(0, 160) ?? undefined,
    robots: { index: true, follow: true },
    alternates: { canonical: productPath(lang, product.id, product.title) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang, id, name } = await params;
  if (!isLocale(lang)) notFound();
  const product = await loadProduct(id);
  if (!product) notFound();
  if (name?.length !== 1 || name[0] !== productSlug(product.title)) permanentRedirect(productPath(lang, product.id, product.title));
  const t = getMessages(lang);
  const crumbs = [
    { label: t.store.home, href: `/${lang}` },
    ...product.categoryPath.map((c) => ({ label: c.name, href: `/${lang}/category/${c.slug}` })),
    ...(product.categoryPath.some((c) => c.id === product.category.id) ? [] : [{ label: product.category.name, href: `/${lang}/category/${product.category.slug}` }]),
    { label: product.title },
  ];
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumbs label={t.nav.breadcrumbs} items={crumbs} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-start">
          <ProductGallery title={product.title} images={product.images} />
          <div className="grid content-start gap-5 lg:sticky lg:top-6">
            <div className="grid gap-1">
              {product.brand ? <p className="type-small font-medium text-ink-2">{product.brand.name}</p> : null}
              <h1 className="type-h2 text-ink">{product.title}</h1>
              <p className="type-small text-ink-2">
                {t.store.soldBy} {product.vendor.displayName}
              </p>
            </div>
            <ProductBuy lang={lang} product={product} />
            {product.description ? (
              <section className="grid gap-2 border-t border-line pt-5">
                <h2 className="type-h4 text-ink">{t.store.description}</h2>
                <p className="whitespace-pre-line text-ink">{product.description}</p>
              </section>
            ) : null}
            {product.attributes.length ? (
              <section className="grid gap-2 border-t border-line pt-5">
                <h2 className="type-h4 text-ink">{t.store.details}</h2>
                <dl className="grid gap-1.5">
                  {product.attributes.map((a) => (
                    <div key={a.key} className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 type-small">
                      <dt className="text-ink-2">{a.label}</dt>
                      <dd className="text-ink">{String(a.value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
