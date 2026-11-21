'use client';

import type { Column } from '@/components/common/data-table';
import type { Locale, Messages } from '@/lib/i18n';
import { formatDate, formatTime } from '@/utils/format';
import { changeText, type StockHistoryEntry } from '@/features/stock/types';

/**
 * The columns of a stock history (Document 5, section 7.4): when in IST, what changed, the number
 * after it and the note. The vendor's history and the staff's share them.
 */
export function historyColumns(lang: Locale, messages: Messages): Column<StockHistoryEntry>[] {
  const columnMessages = messages.stock.historyColumns;
  return [
    {
      key: 'date',
      header: columnMessages.date,
      lead: true,
      cell: (entry) => (
        <span className="whitespace-nowrap">
          {formatDate(entry.createdAt, lang)}, {formatTime(entry.createdAt, lang)}
        </span>
      ),
    },
    {
      key: 'change',
      header: columnMessages.change,
      lead: true,
      cell: (entry) => changeText(entry, messages),
    },
    {
      key: 'result',
      header: columnMessages.result,
      numeric: true,
      cell: (entry) => entry.balanceAfter,
    },
    { key: 'note', header: columnMessages.note, cell: (entry) => entry.note ?? '' },
  ];
}
