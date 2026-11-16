'use client';

import { useRef, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useAppForm } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import type { AppError } from '@/lib/errors';
import {
  BULK_MAX_ROWS,
  BulkProblem,
  bulkFailuresOf,
  BulkStockFormSchema,
  type BulkRow,
  type BulkStockBody,
  type BulkStockFormValues,
  type BulkStockResult,
} from '@/features/stock/types';
import { useBulkSetStock, useEveryStockRow } from './use-stock';

/**
 * The bulk update by SKU (Document 5, section 7.4; approved Stage 5). The backend applies it all or
 * nothing: when any row is wrong nothing changes, and each problem comes back with the row's place
 * in what was sent, which is matched back to the table row and shown there in words. Rows with
 * neither a SKU nor a number are left out. After success the stock the backend returns is shown.
 * When the outcome is unknown the table is not sent again; the current stock of each typed SKU is
 * read and shown beside it. The screen, `bulk-stock.tsx`, only draws.
 */
export const START_ROWS = 3;

const EMPTY_ROW: BulkRow = { sku: '', quantity: '' };
const WHOLE_NUMBER = /^\d+$/;

/** A problem the screen shows on a row: one of the backend's, or one found before sending. */
export enum RowCheck {
  SkuMissing = 'skuMissing',
  QuantityShape = 'quantityShape',
}
export type RowProblem = BulkProblem | RowCheck;

/** Why nothing could be sent at all. */
export enum TableProblem {
  NothingToSend = 'nothingToSend',
  TooMany = 'tooMany',
}

const KNOWN_PROBLEMS: readonly string[] = Object.values(BulkProblem);

export function useBulkStockForm() {
  const bulkSetStock = useBulkSetStock();
  const form = useAppForm<BulkStockFormValues>(BulkStockFormSchema, {
    rows: Array.from({ length: START_ROWS }, () => ({ ...EMPTY_ROW })),
  });
  const rows = useFieldArray({ control: form.control, name: 'rows' });
  const [problems, setProblems] = useState<ReadonlyMap<number, RowProblem>>(new Map());
  const [tableProblem, setTableProblem] = useState<TableProblem | null>(null);
  const [result, setResult] = useState<BulkStockResult | null>(null);
  const [isOutcomeUnknown, setIsOutcomeUnknown] = useState(false);
  // A signal the screen uses to move focus to its message after each send.
  const [answerSignal, setAnswerSignal] = useState(0);
  const everyStockRow = useEveryStockRow(isOutcomeUnknown);
  // The rows of the last send, to match the backend's problems back to the table.
  const sentRows = useRef<FilledRow[]>([]);

  function sendUpdate(values: BulkStockFormValues) {
    setResult(null);
    setIsOutcomeUnknown(false);
    const filled = filledRows(values.rows);
    const tableCheck = checkTable(filled.length);
    const rowChecks = checkRows(filled);
    setTableProblem(tableCheck);
    setProblems(rowChecks);
    if (tableCheck || rowChecks.size > 0) {
      setAnswerSignal((count) => count + 1);
      return;
    }
    sentRows.current = filled;
    bulkSetStock.mutate(bulkBody(filled), { onSuccess: showUpdated, onError: showFailure });
  }

  function showUpdated(answer: BulkStockResult) {
    setResult(answer);
    form.reset({ rows: Array.from({ length: START_ROWS }, () => ({ ...EMPTY_ROW })) });
    setAnswerSignal((count) => count + 1);
  }

  function showFailure(error: AppError) {
    if (error.outcomeUnknown) setIsOutcomeUnknown(true);
    else if (error.code === BackendErrorCode.StockBulkInvalid) {
      setProblems(problemsFromBackend(error.details, sentRows.current));
    }
    setAnswerSignal((count) => count + 1);
  }

  /**
   * Rows copied from a spreadsheet and pasted into a SKU box fill the table from that row on: one
   * row per line, the SKU and the number split by a tab, comma or semicolon.
   */
  function pasteRows(atRow: number, text: string): boolean {
    const pasted = rowsFromText(text);
    if (pasted.length < 2 && !text.includes('\t')) return false;
    const current = form.getValues('rows');
    const next = [...current.slice(0, atRow), ...pasted, ...current.slice(atRow + pasted.length)];
    rows.replace(next.slice(0, BULK_MAX_ROWS));
    return true;
  }

  return {
    form,
    rows,
    sendUpdate,
    pasteRows,
    addRow: () => rows.append({ ...EMPTY_ROW }),
    // The problems name rows by their place, which moves when a row goes, so they are cleared.
    removeRow: (rowIndex: number) => {
      rows.remove(rowIndex);
      setProblems(new Map());
    },
    problems,
    tableProblem,
    result,
    error: bulkSetStock.error,
    isOutcomeUnknown,
    stockNow: everyStockRow.data,
    answerSignal,
    isSending: bulkSetStock.isPending,
  };
}

/** A row with a SKU or a number, and its place in the table. */
export type FilledRow = { rowIndex: number; sku: string; quantity: string };

export function filledRows(tableRows: readonly BulkRow[]): FilledRow[] {
  return tableRows
    .map((row, rowIndex) => ({ rowIndex, sku: row.sku.trim(), quantity: row.quantity.trim() }))
    .filter((row) => row.sku !== '' || row.quantity !== '');
}

export function checkTable(filledCount: number): TableProblem | null {
  if (filledCount === 0) return TableProblem.NothingToSend;
  if (filledCount > BULK_MAX_ROWS) return TableProblem.TooMany;
  return null;
}

/** Only a missing SKU or a number that is not whole is caught here; the rest is the backend's. */
export function checkRows(filled: readonly FilledRow[]): Map<number, RowProblem> {
  const found = new Map<number, RowProblem>();
  for (const row of filled) {
    if (row.sku === '') found.set(row.rowIndex, RowCheck.SkuMissing);
    else if (!WHOLE_NUMBER.test(row.quantity)) found.set(row.rowIndex, RowCheck.QuantityShape);
  }
  return found;
}

export function bulkBody(filled: readonly FilledRow[]): BulkStockBody {
  return { items: filled.map((row) => ({ sku: row.sku, quantity: Number(row.quantity) })) };
}

/** The backend's problems, each moved from its place in what was sent to its table row. */
export function problemsFromBackend(
  details: Record<string, unknown> | undefined,
  sent: readonly FilledRow[],
): Map<number, RowProblem> {
  const found = new Map<number, RowProblem>();
  for (const failure of bulkFailuresOf(details)) {
    const row = sent[failure.index];
    if (row && KNOWN_PROBLEMS.includes(failure.code)) {
      found.set(row.rowIndex, failure.code as BulkProblem);
    }
  }
  return found;
}

export function rowsFromText(text: string): BulkRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      const [sku = '', quantity = ''] = line.split(/\t|,|;/).map((part) => part.trim());
      return { sku, quantity };
    });
}
