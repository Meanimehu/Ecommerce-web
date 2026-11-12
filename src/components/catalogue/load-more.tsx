'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { get } from '@/lib/http';
import { fill, messageFor, toAppError } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import type { ProductCard as Card } from '@/types/catalogue';
import type { Page } from '@/types/common';
import { withQuery, type Query } from '@/utils/url';
import { ProductCard } from './product-card';

/**
 * "Load more" (Document 5, section 6.1; Document 6, 8.8): the first batch comes rendered from the server; each further
 * batch is fetched through our server and added below. "Showing 8 of 128" with a thin progress line; after loading,
 * focus stays on the button and the number added is announced. A failure shows inside this part with "Try again".
 */
export function ProductGrid({ lang, first, query }: { lang: Locale; first: Page<Card>; query: Query }) {
  const t = useMessages();
  const [items, setItems] = useState(first.items);
  const [total, setTotal] = useState(first.total);
  const [page, setPage] = useState(first.page);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const loading = useRef(false);

  const more = async () => {
    if (loading.current) return;
    loading.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = await get<Page<Card>>(withQuery('/api/catalogue/products', { ...query, page: page + 1, limit: first.limit }));
      const known = new Set(items.map((item) => item.id));
      const added = next.items.filter((item) => !known.has(item.id));
      setItems((list) => [...list, ...added]);
      setTotal(next.total);
      setPage(next.page);
      setAnnounce(fill(t.store.added, { count: added.length }));
    } catch (raw) {
      setError(messageFor(toAppError(raw), t));
    } finally {
      loading.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
        {items.map((product, index) => (
          <li key={product.id}>
            <ProductCard product={product} lang={lang} t={t} eager={index < 4} />
          </li>
        ))}
      </ul>
      <p role="status" className="sr-only">
        {announce}
      </p>
      {items.length < total ? (
        <div className="grid justify-items-center gap-3">
          <p className="type-small text-ink-2">{fill(t.store.showing, { shown: items.length, total })}</p>
          <div className="h-0.5 w-full max-w-[240px] overflow-hidden bg-line" aria-hidden="true">
            <div className="h-full bg-ink" style={{ width: `${Math.round((items.length / total) * 100)}%` }} />
          </div>
          {error ? (
            <p role="alert" className="type-small text-error">
              {error}
            </p>
          ) : null}
          <Button type="button" variant="secondary" size="large" loading={busy} onClick={() => void more()}>
            {error ? t.errors.tryAgain : t.store.loadMore}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
