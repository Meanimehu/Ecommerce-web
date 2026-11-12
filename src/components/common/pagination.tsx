import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { cn } from '@/utils/cn';

/**
 * Numbered pages for tables (Document 5, section 3; Document 6, 8.9): page buttons drawn 40 px high (44 px hit area on
 * compact), the current page in ink, "Page 1 of 6" and the total beside them. Links, so the page is in the address.
 */
export function Pagination({ page, limit, total, hrefFor, messages }: { page: number; limit: number; total: number; hrefFor: (page: number) => string; messages: Messages }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const numbers = pageWindow(page, pages);
  const item = 'inline-flex h-10 min-w-10 items-center justify-center rounded-2 border px-3 type-small font-medium no-underline transition-colors duration-100';
  return (
    <nav aria-label={messages.table.pages} className="flex flex-wrap items-center justify-between gap-3">
      <p className="type-small text-ink-2">{fill(messages.table.pageOf, { page: Math.min(page, pages), pages, total })}</p>
      {pages > 1 ? (
        <ul className="flex flex-wrap items-center gap-1.5">
          {page > 1 ? (
            <li>
              <a href={hrefFor(page - 1)} className={cn(item, 'border-control bg-surface text-ink hover:border-ink')}>
                <ChevronLeft aria-hidden="true" className="size-4" />
                <span className="sr-only">{messages.table.previous}</span>
              </a>
            </li>
          ) : null}
          {numbers.map((n, i) =>
            n === null ? (
              <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">
                …
              </li>
            ) : (
              <li key={n}>
                <a
                  href={hrefFor(n)}
                  aria-current={n === page ? 'page' : undefined}
                  className={cn(item, n === page ? 'border-ink bg-ink text-surface' : 'border-control bg-surface text-ink hover:border-ink')}
                >
                  <span className="sr-only">{messages.table.page} </span>
                  {n}
                </a>
              </li>
            ),
          )}
          {page < pages ? (
            <li>
              <a href={hrefFor(page + 1)} className={cn(item, 'border-control bg-surface text-ink hover:border-ink')}>
                <ChevronRight aria-hidden="true" className="size-4" />
                <span className="sr-only">{messages.table.next}</span>
              </a>
            </li>
          ) : null}
        </ul>
      ) : null}
    </nav>
  );
}

/** Page numbers to show: the first, the last, and two either side of the current one, with gaps as null. */
export function pageWindow(page: number, pages: number): (number | null)[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  for (const n of sorted) {
    const last = out.at(-1);
    if (typeof last === 'number' && n - last > 1) out.push(null);
    out.push(n);
  }
  return out;
}
