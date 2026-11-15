'use client';

import { Search } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { searchPath } from '@/lib/routes';
import { cn } from '@/utils/cn';
import { SEARCH_TEXT_MAX } from '@/features/storefront/product-list/rules';
import { useSearchBox } from '@/features/storefront/search/hooks/use-search-box';

/**
 * The storefront search box (Document 5, sections 5 and 6.1; Document 6, 7.3): a plain search form
 * that opens the results page, so it works before any script, with suggestions in a list below it
 * as the person types. It only draws; the behaviour is in `use-search-box.ts`. `id` keeps the
 * expanded and compact boxes apart.
 */
export function SearchBox({
  lang,
  id,
  initialText = '',
  className,
}: {
  lang: Locale;
  id: string;
  initialText?: string;
  className?: string;
}) {
  const messages = useMessages();
  const navMessages = messages.nav;
  const searchBox = useSearchBox({ lang, messages, initialText });
  const listId = `${id}-suggestions`;
  // Option ids carry the box's id, so the expanded and compact boxes never share one.
  const optionId = (optionKey: string) => `${listId}-${optionKey}`;
  return (
    <form
      role="search"
      action={searchPath(lang)}
      method="get"
      className={cn('relative', className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) searchBox.close();
      }}
    >
      <label htmlFor={id} className="sr-only">
        {navMessages.searchLabel}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        value={searchBox.typed}
        maxLength={SEARCH_TEXT_MAX}
        placeholder={navMessages.searchPlaceholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={searchBox.isShown}
        aria-controls={listId}
        aria-activedescendant={searchBox.activeId ? optionId(searchBox.activeId) : undefined}
        onChange={(event) => searchBox.onType(event.target.value)}
        onFocus={searchBox.open}
        onKeyDown={searchBox.onKeyDown}
        className="h-11 w-full min-w-0 rounded-2 border border-control bg-surface ps-3.5 pe-12 text-base text-ink outline-none placeholder:text-muted-foreground hover:border-ink"
      />
      <button
        type="submit"
        className="absolute inset-y-0 end-0 inline-flex w-11 items-center justify-center rounded-e-2 text-ink hover:bg-sunken"
      >
        <Search aria-hidden="true" className="size-5" />
        <span className="sr-only">{navMessages.search}</span>
      </button>
      <div
        id={listId}
        role="listbox"
        aria-label={navMessages.searchLabel}
        hidden={!searchBox.isShown}
        className="absolute inset-x-0 top-full z-40 mt-1 grid gap-2 rounded-2 border border-line bg-surface py-2 shadow-overlay"
      >
        {searchBox.groups.map((group) => (
          <div key={group.id} role="group" aria-labelledby={`${listId}-${group.id}`}>
            <p
              id={`${listId}-${group.id}`}
              role="presentation"
              className="px-3.5 py-1 type-caption text-muted-foreground"
            >
              {group.label}
            </p>
            {group.options.map((option) => (
              <a
                key={option.id}
                id={optionId(option.id)}
                role="option"
                aria-selected={option.id === searchBox.activeId}
                href={option.href}
                tabIndex={-1}
                className="block truncate px-3.5 py-2.5 text-ink no-underline hover:bg-sunken aria-selected:bg-sunken"
              >
                {option.label}
              </a>
            ))}
          </div>
        ))}
      </div>
    </form>
  );
}
