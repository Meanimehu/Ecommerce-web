import 'server-only';
import { callBackend, type CallResult } from '@/api/client';
import { boundedCache } from '@/utils/bounded-cache';
import { SuggestionsSchema, type Suggestions } from '@/features/storefront/search/types';

/**
 * Backend Area 3a, suggestions while typing (area-3a-catalogue.md, section 1): no login, the same
 * for everyone. Kept on our server for 10 seconds, at most 2,000 texts, under the trimmed,
 * lower-cased text (Document 4, section 7; Document 7, section 12).
 */
const SUGGEST_CACHE_LIFE_MS = 10_000;
const CACHE_MAX_ENTRIES = 2_000;

const suggestCache = boundedCache<CallResult<Suggestions>>({
  lifeMs: SUGGEST_CACHE_LIFE_MS,
  maxEntries: CACHE_MAX_ENTRIES,
});

/** The suggestions for some text (1 to 100 characters, trimmed by the caller). */
export const suggest = (text: string) =>
  suggestCache(text.toLowerCase(), () =>
    callBackend({
      method: 'GET',
      path: '/catalogue/suggest',
      query: { q: text },
      kind: 'view',
      schema: SuggestionsSchema,
    }),
  );
