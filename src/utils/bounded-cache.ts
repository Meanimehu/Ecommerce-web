/**
 * A small in-memory cache with a life per entry and a limit on the number of entries (Document 4,
 * section 7): once full, the oldest entry goes first. Only successful answers are kept, because a
 * failed call throws and is never stored. It knows nothing about the app; its users choose the key,
 * which must hold every input that changes the answer and nothing personal.
 */
export function boundedCache<Value>({
  lifeMs,
  maxEntries,
}: {
  lifeMs: number;
  maxEntries: number;
}) {
  const entries = new Map<string, { value: Promise<Value>; expiresAt: number }>();

  return async function cached(key: string, load: () => Promise<Value>): Promise<Value> {
    const now = Date.now();
    const kept = entries.get(key);
    if (kept && kept.expiresAt > now) return kept.value;
    entries.delete(key);
    // The promise is kept at once, so requests that arrive together share one call.
    const value = load();
    entries.set(key, { value, expiresAt: now + lifeMs });
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
    try {
      return await value;
    } catch (error) {
      if (entries.get(key)?.value === value) entries.delete(key);
      throw error;
    }
  };
}
