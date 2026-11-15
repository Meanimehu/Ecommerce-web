import { getMessages } from '@/lib/messages';
import type { Locale } from '@/lib/i18n';
import { categoryPath } from '@/lib/routes';
import * as productListApi from '@/features/storefront/product-list/server/product-list-api';
import type { CategoryNode } from '@/features/storefront/product-list/types';
import { SearchBox } from '@/features/storefront/search/components/search-box';
import { HeaderActions } from './header-actions';
import { LanguageSwitch } from './language-switch';
import { SiteMenu } from './site-menu';
import { Wordmark } from './wordmark';

/**
 * The top-level categories that have products, or none when the tree cannot be read: the header
 * still works.
 */
async function topCategories(): Promise<CategoryNode[]> {
  try {
    const tree = (await productListApi.getCategoryTree()).data;
    return tree.items.filter((category) => category.productCount > 0);
  } catch {
    return [];
  }
}

/**
 * The storefront header (Document 6, 7.3; Document 5, section 5), with the stitch line under it.
 * Expanded: the wordmark, the search box, the language switch, "Log in" or the account, the cart,
 * and a second row with the top-level categories. Compact and medium: the menu button (the
 * language switch and the categories), the wordmark, the account and the cart, and the search box
 * on its own row. It is not fixed, so it never covers content (D6-22). The categories come from
 * `product-list`'s category tree, kept on our server for 10 minutes.
 */
export async function SiteHeader({ lang, searchText }: { lang: Locale; searchText?: string }) {
  const navMessages = getMessages(lang).nav;
  const categories = await topCategories();
  return (
    <header className="stitch-bottom relative bg-surface">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 px-4 sm:h-16 sm:px-6 lg:gap-6 lg:px-8">
        <SiteMenu lang={lang} categories={categories} messages={navMessages} />
        <Wordmark lang={lang} />
        <SearchBox
          lang={lang}
          id="search-wide"
          initialText={searchText}
          className="max-w-[480px] flex-1 max-lg:hidden"
        />
        <div className="ms-auto flex items-center gap-1">
          <div className="max-lg:hidden">
            <LanguageSwitch lang={lang} />
          </div>
          <HeaderActions lang={lang} />
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-4 pb-3 sm:px-6 lg:hidden">
        <SearchBox lang={lang} id="search-narrow" initialText={searchText} />
      </div>
      {categories.length ? (
        <nav aria-label={navMessages.categories} className="max-lg:hidden">
          <ul className="mx-auto flex max-w-[1200px] flex-wrap gap-x-6 px-8 pb-2">
            {categories.map((category) => (
              <li key={category.id}>
                <a
                  href={categoryPath(lang, category.slug)}
                  className="inline-flex h-11 items-center type-label text-ink no-underline hover:underline"
                >
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
