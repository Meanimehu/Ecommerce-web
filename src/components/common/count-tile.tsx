import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * A count with its label, as a link to the list it counts (Document 5, section 7.2; approved Stage 5
 * Vendor home): the number large, the words under it. Shared UI only; what is counted is the
 * caller's.
 */
export function CountTile({
  count,
  label,
  href,
}: {
  count: ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="grid min-h-11 gap-0.5 rounded-1 border border-line bg-surface px-4 py-3 no-underline hover:border-ink"
    >
      <span className="type-h3 text-ink tabular-nums">{count}</span>
      <span className="type-small text-ink-2 underline underline-offset-4">{label}</span>
    </Link>
  );
}
