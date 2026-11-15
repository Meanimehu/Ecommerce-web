'use client';

import { useState, type KeyboardEvent } from 'react';
import type { Locale, Messages } from '@/lib/i18n';
import { brandPath, categoryPath, productPath } from '@/lib/routes';
import type { Suggestions } from '@/features/storefront/search/types';
import { useSuggestions } from './use-suggestions';

/** One suggestion in the list: its words and the page it opens. */
export type SuggestionOption = { id: string; label: string; href: string };

/** The suggestions in their groups, in the order shown, each with its heading. */
export type SuggestionGroup = { id: string; label: string; options: SuggestionOption[] };

function groupsOf(
  suggestions: Suggestions | undefined,
  lang: Locale,
  messages: Messages,
): SuggestionGroup[] {
  if (!suggestions) return [];
  const navMessages = messages.nav;
  const groups: SuggestionGroup[] = [
    {
      id: 'products',
      label: navMessages.suggestedProducts,
      options: suggestions.products.map((product) => ({
        id: `product-${product.id}`,
        label: product.title,
        href: productPath(lang, product.id, product.title),
      })),
    },
    {
      id: 'categories',
      label: navMessages.suggestedCategories,
      options: suggestions.categories.map((category) => ({
        id: `category-${category.id}`,
        label: category.name,
        href: categoryPath(lang, category.slug),
      })),
    },
    {
      id: 'brands',
      label: navMessages.suggestedBrands,
      options: suggestions.brands.map((brand) => ({
        id: `brand-${brand.id}`,
        label: brand.name,
        href: brandPath(lang, brand.slug),
      })),
    },
  ];
  return groups.filter((group) => group.options.length);
}

/**
 * The search box's behaviour (Document 5, section 6.1; the ARIA combobox pattern): suggestions as
 * the person types, grouped into products, categories and brands. Up and Down move through them,
 * Enter opens the one chosen or, with none chosen, the search results; Escape closes the list. The
 * box is a plain form, so Enter searches even before the page's scripts have loaded.
 */
export function useSearchBox({
  lang,
  messages,
  initialText,
}: {
  lang: Locale;
  messages: Messages;
  initialText: string;
}) {
  const [typed, setTyped] = useState(initialText);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = useSuggestions(typed);
  const groups = groupsOf(suggestions.data, lang, messages);
  const options = groups.flatMap((group) => group.options);
  const isShown = isOpen && typed.trim().length > 0 && options.length > 0;
  const active = isShown ? options[activeIndex] : undefined;

  function onType(text: string) {
    setTyped(text);
    setIsOpen(true);
    setActiveIndex(-1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      if (isShown) event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!options.length) return;
      event.preventDefault();
      setIsOpen(true);
      const last = options.length - 1;
      // Past either end the choice goes back to the typed text (-1), as in a browser's own list.
      setActiveIndex((index) => {
        if (event.key === 'ArrowDown') return index === last ? -1 : index + 1;
        return index === -1 ? last : index - 1;
      });
      return;
    }
    if (event.key === 'Enter' && active) {
      event.preventDefault();
      window.location.assign(active.href);
    }
  }

  return {
    typed,
    groups,
    isShown,
    activeId: active?.id,
    onType,
    onKeyDown,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
