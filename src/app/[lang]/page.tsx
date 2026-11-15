import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/features/layout/components/site-footer';
import { SiteHeader } from '@/features/layout/components/site-header';
import { isLocale } from '@/lib/i18n';
import { getMessages, sectionMessages } from '@/lib/messages';
import { MessagesProvider } from '@/lib/messages-context';
import { homePath } from '@/lib/routes';
import { HomeHero } from '@/features/storefront/home/components/home-hero';
import { CatalogueEntries } from '@/features/storefront/product-list/components/catalogue-entries';
import { NewArrivals } from '@/features/storefront/product-list/components/new-arrivals';
import * as productListApi from '@/features/storefront/product-list/server/product-list-api';
import { ProductSort } from '@/features/storefront/product-list/rules';

/**
 * The storefront home (Document 5, section 6.1, D5-12, D5-16; Document 6, 7.4): the hero, "Shop
 * by category", "Brands" and New arrivals. Nothing on it depends on who is looking, so it is kept
 * and shared for 60 seconds, New arrivals included (Document 4, D4-09). A part the server could
 * not read is drawn empty and read again in the browser, with "Try again" in that part only.
 */
export const revalidate = 60;

/** As many New arrivals as the approved Stage 5 screens show. */
const NEW_ARRIVALS = 4;
/** One page of the brand list (Document 8, Slice 3 notes). */
const BRAND_LIMIT = 100;

/** The answer, or null when it could not be read: the browser then tries again. */
async function orNull<T>(call: () => Promise<{ data: T }>): Promise<T | null> {
  try {
    return (await call()).data;
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: getMessages(lang).site.wordmark,
    robots: { index: true, follow: true },
    alternates: { canonical: homePath(lang) },
  };
}

export default async function Home({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const messages = getMessages(lang);
  const [tree, brands, newest] = await Promise.all([
    orNull(() => productListApi.getCategoryTree()),
    orNull(() => productListApi.listBrands(1, BRAND_LIMIT)),
    orNull(() =>
      productListApi.listProducts({ sort: ProductSort.Newest, page: 1, limit: NEW_ARRIVALS }),
    ),
  ]);
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-6 sm:px-6 lg:px-8">
        <HomeHero messages={messages} />
        <MessagesProvider messages={sectionMessages(lang, ['store'])}>
          <CatalogueEntries
            lang={lang}
            drawnTree={tree}
            drawnBrands={brands?.items ?? null}
            brandLimit={BRAND_LIMIT}
          />
          <NewArrivals lang={lang} drawn={newest?.items ?? null} limit={NEW_ARRIVALS} />
        </MessagesProvider>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
