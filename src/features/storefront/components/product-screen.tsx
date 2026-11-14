import { Breadcrumbs } from '@/components/common/breadcrumbs';
import type { Locale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { categoryPath, homePath } from '@/lib/routes';
import { categoryTrail, type ProductDetail } from '@/features/storefront/types';
import { ProductBuy } from './product-buy';
import { ProductGallery } from './product-gallery';

/**
 * A product page's content (Document 5, section 6.2): where it sits, the photos, the brand, title
 * and seller, choosing and adding to the cart, the description and the details. Drawn on the
 * server; the buy box reads the product again in the browser.
 */
export function ProductScreen({ lang, product }: { lang: Locale; product: ProductDetail }) {
  const messages = getMessages(lang);
  const storeMessages = messages.store;
  const crumbs = [
    { label: storeMessages.home, href: homePath(lang) },
    ...categoryTrail(product).map((crumb) => ({
      label: crumb.name,
      href: categoryPath(lang, crumb.slug),
    })),
    { label: product.title },
  ];

  return (
    <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-start">
        <ProductGallery title={product.title} images={product.images} />
        <div className="grid content-start gap-5 lg:sticky lg:top-6">
          <div className="grid gap-1">
            {product.brand ? (
              <p className="type-small font-medium text-ink-2">{product.brand.name}</p>
            ) : null}
            <h1 className="type-h2 text-ink">{product.title}</h1>
            <p className="type-small text-ink-2">
              {storeMessages.soldBy} {product.vendor.displayName}
            </p>
          </div>
          <ProductBuy lang={lang} product={product} />
          {product.description ? (
            <section className="grid gap-2 border-t border-line pt-5">
              <h2 className="type-h4 text-ink">{storeMessages.description}</h2>
              <p className="whitespace-pre-line text-ink">{product.description}</p>
            </section>
          ) : null}
          {product.attributes.length ? (
            <section className="grid gap-2 border-t border-line pt-5">
              <h2 className="type-h4 text-ink">{storeMessages.details}</h2>
              <dl className="grid gap-1.5">
                {product.attributes.map((attribute) => (
                  <div
                    key={attribute.key}
                    className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 type-small"
                  >
                    <dt className="text-ink-2">{attribute.label}</dt>
                    <dd className="text-ink">{String(attribute.value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
