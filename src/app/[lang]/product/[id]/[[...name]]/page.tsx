import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import { SiteHeader } from '@/components/common/site-header';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { productPath, productSlug } from '@/lib/routes';
import { ProductScreen } from '@/features/storefront/components/product-screen';
import * as storefrontApi from '@/features/storefront/server/storefront-api';

/**
 * The product page (Document 5, section 6.2; Document 4, D4-02): /{lang}/product/{id}/{name}. The
 * id is what is looked up; a missing or wrong name part redirects to the full address. A product
 * that is not visible is a real 404. The page holds nothing about who is looking, so it may be kept
 * for 60 seconds; price and stock are read again in the browser before adding to the cart.
 */
export const revalidate = 60;

/** The description's start, for search results. */
const DESCRIPTION_PREVIEW_LENGTH = 160;

const loadProduct = cache((id: string) => storefrontApi.findVisibleProduct(id));

type Props = { params: Promise<{ lang: string; id: string; name?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLocale(lang)) return {};
  const product = await loadProduct(id);
  if (!product) return {};
  return {
    title: `${product.title} | ${getMessages(lang).site.wordmark}`,
    description: product.description?.slice(0, DESCRIPTION_PREVIEW_LENGTH) ?? undefined,
    robots: { index: true, follow: true },
    alternates: { canonical: productPath(lang, product.id, product.title) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang, id, name } = await params;
  if (!isLocale(lang)) notFound();
  const product = await loadProduct(id);
  if (!product) notFound();
  const isFullAddress = name?.length === 1 && name[0] === productSlug(product.title);
  if (!isFullAddress) permanentRedirect(productPath(lang, product.id, product.title));
  return (
    <>
      <SiteHeader lang={lang} />
      <ProductScreen lang={lang} product={product} />
    </>
  );
}
