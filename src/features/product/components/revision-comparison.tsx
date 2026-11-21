'use client';

import { DataTable, type Column } from '@/components/common/data-table';
import { StatusChip } from '@/components/common/status-chip';
import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { isSingular } from '@/utils/format';

/**
 * The live version and a revision side by side (Document 5, section 7.3; approved Stage 5, "Live
 * version and revision"), each changed value marked in words as well as colour. Shared by the
 * vendor's revision panel and the moderator's review: each builds the rows from what it can read
 * (the vendor from the product form's lists, the moderator from the public lists).
 */
export interface ComparedRow {
  key: string;
  label: string;
  live: string;
  proposed: string;
  isChanged: boolean;
}

export function RevisionComparison({
  rows,
  proposedHeader,
}: {
  rows: readonly ComparedRow[];
  /** The proposed column's name: "Your revision" for the vendor, "Proposed" for a moderator. */
  proposedHeader?: string;
}) {
  const revisionMessages = useMessages().product.revision;
  const columns: Column<ComparedRow>[] = [
    { key: 'field', header: revisionMessages.field, lead: true, cell: (row) => row.label },
    {
      key: 'live',
      header: revisionMessages.liveColumn,
      cell: (row) => <span className="whitespace-pre-line">{row.live}</span>,
    },
    {
      key: 'proposed',
      header: proposedHeader ?? revisionMessages.revisionColumn,
      cell: (row) => (
        <span
          className={
            row.isChanged ? 'grid gap-1 rounded-1 bg-warning-fill px-2 py-1' : 'grid gap-1'
          }
        >
          <span className="whitespace-pre-line">{row.proposed}</span>
          {row.isChanged ? (
            <span>
              <StatusChip tone="warning" label={revisionMessages.changed} />
            </span>
          ) : null}
        </span>
      ),
    },
  ];
  return (
    <DataTable
      rows={[...rows]}
      columns={columns}
      rowKey={(row) => row.key}
      caption={revisionMessages.compareTitle}
    />
  );
}

/** "1 photo" or "4 photos". */
export function photoCountText(count: number, messages: Messages): string {
  const revisionMessages = messages.product.revision;
  return isSingular(count)
    ? revisionMessages.photoCountOne
    : fill(revisionMessages.photoCount, { count });
}

/** The proposed photos: how many, and what changed. */
export function photosText(
  proposedCount: number,
  photoChanges: { added: readonly string[]; removed: readonly string[]; reordered: boolean },
  messages: Messages,
): string {
  const revisionMessages = messages.product.revision;
  const { added, removed, reordered } = photoChanges;
  const parts = [photoCountText(proposedCount, messages)];
  if (added.length > 0 || removed.length > 0) {
    parts.push(
      fill(revisionMessages.photoChanges, { added: added.length, removed: removed.length }),
    );
  }
  if (reordered) parts.push(revisionMessages.photosReordered);
  return parts.join('\n');
}
