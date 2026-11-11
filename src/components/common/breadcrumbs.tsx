import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Breadcrumbs (Document 6, 8.11): small muted links separated by a chevron, the current page in ink. On compact only
 * the parent shows, with a back arrow and a 44 px hit area.
 */
export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, label }: { items: readonly Crumb[]; label: string }) {
  const parent = [...items].reverse().find((item) => item.href);
  return (
    <nav aria-label={label} className="type-small">
      <ol className="hidden flex-wrap items-center gap-1.5 sm:flex">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" /> : null}
            {item.href ? (
              <a href={item.href} className="text-muted-foreground underline-offset-4 hover:text-ink hover:underline">
                {item.label}
              </a>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      {parent?.href ? (
        <a href={parent.href} className="inline-flex min-h-11 items-center gap-1 text-muted-foreground no-underline hover:text-ink sm:hidden">
          <ChevronLeft aria-hidden="true" className="size-4" />
          {parent.label}
        </a>
      ) : null}
    </nav>
  );
}
