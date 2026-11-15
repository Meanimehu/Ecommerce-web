'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { get } from '@/lib/http';
import { withQuery } from '@/utils/url';
import type { Suggestions } from '@/features/storefront/search/types';

/**
 * The call of `search`: suggestions for what is typed, to our own endpoint (D3-03). It waits until
 * typing pauses, so each keystroke does not send a request (Document 5, section 6.1). The same text
 * is not asked twice while the page is open.
 */
const SUGGEST_PATH = '/api/catalogue/suggest';
/** How long typing must pause before asking. */
const TYPING_PAUSE_MS = 250;

export const searchKeys = {
  suggestions: (text: string) => ['search', 'suggestions', text] as const,
};

export function useSuggestions(typed: string) {
  const text = typed.trim();
  const [settled, setSettled] = useState(text);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(text), TYPING_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [text]);
  return useQuery({
    queryKey: searchKeys.suggestions(settled.toLowerCase()),
    queryFn: () => get<Suggestions>(withQuery(SUGGEST_PATH, { q: settled })),
    enabled: settled.length > 0,
    staleTime: Infinity,
  });
}
