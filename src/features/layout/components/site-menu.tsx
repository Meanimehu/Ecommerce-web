import { Menu, X } from 'lucide-react';
import type { Locale, Messages } from '@/lib/i18n';
import { categoryPath } from '@/lib/routes';
import type { CategoryNode } from '@/features/storefront/product-list/types';
import { LanguageSwitch } from './language-switch';

/**
 * The storefront menu on compact and medium screens (Document 6, 7.3): a menu button that opens a
 * panel under the header with the language switch first, then the top-level categories. It is a
 * native disclosure (`details`), so it works without any script, which keeps the storefront's
 * pages light (Document 6, section 14).
 */
export function SiteMenu({
  lang,
  categories,
  messages,
}: {
  lang: Locale;
  categories: CategoryNode[];
  messages: Messages['nav'];
}) {
  return (
    <details className="group lg:hidden">
      <summary className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-2 text-ink hover:bg-sunken [&::-webkit-details-marker]:hidden">
        <Menu aria-hidden="true" className="size-6 group-open:hidden" />
        <X aria-hidden="true" className="hidden size-6 group-open:block" />
        <span className="sr-only">{messages.menu}</span>
      </summary>
      <div className="absolute inset-x-0 top-full z-40 grid gap-2 border-b border-line bg-surface px-4 py-3 shadow-overlay sm:px-6">
        <LanguageSwitch lang={lang} />
        {categories.length ? (
          <nav aria-label={messages.categories} className="border-t border-line pt-2">
            <ul className="grid">
              {categories.map((category) => (
                <li key={category.id}>
                  <a
                    href={categoryPath(lang, category.slug)}
                    className="flex min-h-11 items-center rounded-2 px-2 text-ink no-underline hover:bg-sunken"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </details>
  );
}
