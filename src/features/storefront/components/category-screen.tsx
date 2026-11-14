import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { getMessages, sectionMessages } from '@/lib/messages';
import { MessagesProvider } from '@/lib/messages-context';
import { categoryPath, homePath } from '@/lib/routes';
import type { Page } from '@/types/common';
import type { Query } from '@/utils/url';
import type { CategoryNode, ProductCardData } from '@/features/storefront/types';
import { ProductGrid } from './product-grid';

/**
 * A category page's content (Document 5, section 6.1): where it sits, its name and how many
 * products it has, its sub-categories, and its products with "Load more". Drawn on the server. It
 * gives the browser the shop's text (`store`), which only the shop's pages carry (lib/messages.ts).
 */
export function CategoryScreen({
  lang,
  categoryPathNodes,
  firstBatch,
  query,
}: {
  lang: Locale;
  /** From the top level down to this category. */
  categoryPathNodes: CategoryNode[];
  firstBatch: Page<ProductCardData>;
  query: Query;
}) {
  const messages = getMessages(lang);
  const storeMessages = messages.store;
  const category = categoryPathNodes.at(-1);
  if (!category) return null;
  const crumbs = [
    { label: storeMessages.home, href: homePath(lang) },
    ...categoryPathNodes.map((node, index) => ({
      label: node.name,
      // The page's own category is not a link.
      href: index < categoryPathNodes.length - 1 ? categoryPath(lang, node.slug) : undefined,
    })),
  ];
  const countText = firstBatch.total === 1 ? storeMessages.productsOne : storeMessages.productsMany;

  return (
    <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
      <div className="grid gap-1">
        <h1 className="type-h1 text-ink">{category.name}</h1>
        <p className="text-ink-2">{fill(countText, { count: firstBatch.total })}</p>
      </div>
      {category.children.length ? (
        <nav aria-label={storeMessages.subcategories}>
          <ul className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <li key={child.id}>
                <a
                  href={categoryPath(lang, child.slug)}
                  className="inline-flex min-h-11 items-center rounded-2 border border-control bg-surface px-3 type-small text-ink no-underline hover:border-ink"
                >
                  {child.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      {firstBatch.items.length ? (
        <MessagesProvider messages={sectionMessages(lang, ['store'])}>
          <ProductGrid lang={lang} firstBatch={firstBatch} query={query} />
        </MessagesProvider>
      ) : (
        <p className="rounded-1 border border-dashed border-control bg-surface px-6 py-10 text-center text-ink-2">
          {storeMessages.noProducts}
        </p>
      )}
    </main>
  );
}
