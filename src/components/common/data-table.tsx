import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * A staff table (Document 6, 8.9): header on sunken, 56 px rows with solid hairlines, numbers right-aligned, the row's
 * name is the link. Below 768 px each row becomes a stacked block (name and status first, then label and value), so a
 * table never scrolls sideways on a phone; between 768 and 1023 px it scrolls inside its own frame.
 */
export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Numbers and prices. */
  numeric?: boolean;
  /** Shown first in the stacked block, without a label (the name, the status). */
  lead?: boolean;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  caption,
}: {
  rows: readonly T[];
  columns: readonly Column<T>[];
  rowKey: (row: T) => string;
  caption: string;
}) {
  const lead = columns.filter((c) => c.lead);
  const rest = columns.filter((c) => !c.lead);
  return (
    <>
      <div className="hidden overflow-x-auto rounded-1 border border-line bg-surface md:block">
        <table className="w-full border-collapse text-start">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-sunken">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'h-11 px-4 type-small font-medium whitespace-nowrap text-ink-2',
                    column.numeric ? 'text-end' : 'text-start',
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-t border-line transition-colors duration-100 hover:bg-page"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'h-14 px-4 py-2 align-middle',
                      column.numeric && 'text-end tabular-nums',
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul aria-label={caption} className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="grid gap-2 rounded-1 border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {lead.map((column) => (
                <div key={column.key}>{column.cell(row)}</div>
              ))}
            </div>
            <dl className="grid gap-1 type-small">
              {rest.map((column) => (
                <div key={column.key} className="flex flex-wrap justify-between gap-2">
                  <dt className="text-ink-2">{column.header}</dt>
                  <dd className={cn('text-ink', column.numeric && 'tabular-nums')}>
                    {column.cell(row)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
