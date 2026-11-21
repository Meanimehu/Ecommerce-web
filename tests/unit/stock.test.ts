import { describe, expect, it } from 'vitest';
import { getMessages } from '@/lib/messages';
import {
  bulkBody,
  checkRows,
  checkTable,
  filledRows,
  problemsFromBackend,
  RowCheck,
  rowsFromText,
  TableProblem,
} from '@/features/stock/hooks/use-bulk-stock-form';
import { adjustment } from '@/features/stock/hooks/use-stock-change-form';
import { thresholdBody, thresholdText } from '@/features/stock/hooks/use-threshold-form';
import {
  BULK_MAX_ROWS,
  BulkProblem,
  bulkFailuresOf,
  changeText,
  signed,
  StockChangeFormSchema,
  StockChangeMode,
  StockReason,
  variantName,
} from '@/features/stock/types';

const messages = getMessages('en');
const entry = (reason: string, delta: number, balanceAfter: number) => ({
  id: 'h1',
  reason,
  delta,
  balanceAfter,
  note: null,
  createdAt: '2026-11-16T05:30:00Z',
});

describe('stock words (Document 5, section 7.4)', () => {
  it('names a variant by its product, size and colour, from the form guide', () => {
    const row = { productTitle: 'Block-print kurta', sizeCode: 'M', colourCode: 'IND' };
    expect(
      variantName(row, [{ code: 'M', label: 'Medium' }], [{ code: 'IND', label: 'Indigo' }]),
    ).toBe('Block-print kurta · Medium · Indigo');
    // A code the guide does not list is shown as it is; a missing one is left out.
    expect(variantName({ ...row, colourCode: null })).toBe('Block-print kurta · M');
  });

  it('says what each history entry changed', () => {
    expect(changeText(entry(StockReason.VendorSet, 9, 12), messages)).toBe('Set to 12');
    expect(changeText(entry(StockReason.VendorAdjust, -3, 9), messages)).toBe('Removed 3');
    expect(changeText(entry(StockReason.VendorAdjust, 5, 14), messages)).toBe('Added 5');
    expect(changeText(entry(StockReason.Reserve, -2, 7), messages)).toBe('Held for an order −2');
    // A reason this screen does not know shows the backend's word.
    expect(changeText(entry('audit_fix', 1, 8), messages)).toBe('audit_fix +1');
    expect(signed(0)).toBe('0');
  });
});

describe('changing one variant', () => {
  it('sends a signed amount, and a note only when one was written', () => {
    expect(adjustment(StockChangeMode.Remove, 3, 'Damaged')).toEqual({
      delta: -3,
      note: 'Damaged',
    });
    expect(adjustment(StockChangeMode.Add, 5, '')).toEqual({ delta: 5 });
  });

  it('accepts only a whole number', () => {
    const base = { mode: StockChangeMode.Set, note: '' };
    expect(StockChangeFormSchema.safeParse({ ...base, amount: '12' }).success).toBe(true);
    expect(StockChangeFormSchema.safeParse({ ...base, amount: '-1' }).success).toBe(false);
    expect(StockChangeFormSchema.safeParse({ ...base, amount: '2.5' }).success).toBe(false);
    expect(StockChangeFormSchema.safeParse({ ...base, amount: '' }).success).toBe(false);
  });

  it('an empty threshold goes back to the default', () => {
    expect(thresholdBody('')).toEqual({ lowStockThreshold: null });
    expect(thresholdBody('0')).toEqual({ lowStockThreshold: 0 });
    expect(thresholdText(null)).toBe('');
    expect(thresholdText(10)).toBe('10');
  });
});

describe('the bulk update by SKU', () => {
  const table = [
    { sku: ' st-1 ', quantity: '30' },
    { sku: '', quantity: '' },
    { sku: 'NO-SUCH', quantity: '5' },
    { sku: 'st-2', quantity: 'seven' },
    { sku: '', quantity: '4' },
  ];

  it('leaves out empty rows and keeps each row’s place', () => {
    expect(filledRows(table).map((row) => row.rowIndex)).toEqual([0, 2, 3, 4]);
    expect(filledRows(table)[0]).toEqual({ rowIndex: 0, sku: 'st-1', quantity: '30' });
  });

  it('catches a missing SKU or a number that is not whole, and nothing else', () => {
    expect([...checkRows(filledRows(table))]).toEqual([
      [3, RowCheck.QuantityShape],
      [4, RowCheck.SkuMissing],
    ]);
  });

  it('needs at least one row and at most the backend’s limit', () => {
    expect(checkTable(0)).toBe(TableProblem.NothingToSend);
    expect(checkTable(BULK_MAX_ROWS)).toBeNull();
    expect(checkTable(BULK_MAX_ROWS + 1)).toBe(TableProblem.TooMany);
  });

  it('sends numbers, and matches the backend’s problems back to the table rows', () => {
    const sent = filledRows([table[0], table[1], table[2]] as typeof table);
    expect(bulkBody(sent)).toEqual({
      items: [
        { sku: 'st-1', quantity: 30 },
        { sku: 'NO-SUCH', quantity: 5 },
      ],
    });
    const details = {
      failures: [
        { index: 1, sku: 'NO-SUCH', code: BulkProblem.SkuUnknown, message: 'x' },
        { index: 7, sku: 'GONE', code: BulkProblem.SkuUnknown, message: 'x' },
        { index: 0, sku: 'ST-1', code: 'SOMETHING_NEW', message: 'x' },
      ],
    };
    // The second sent row is the table's third; an unknown place or code is left out.
    expect([...problemsFromBackend(details, sent)]).toEqual([[2, BulkProblem.SkuUnknown]]);
    expect(bulkFailuresOf({ failures: 'no' })).toEqual([]);
  });

  it('reads rows pasted from a spreadsheet', () => {
    expect(rowsFromText('A-1\t3\r\nB-2, 4\n\nC-3;5\n')).toEqual([
      { sku: 'A-1', quantity: '3' },
      { sku: 'B-2', quantity: '4' },
      { sku: 'C-3', quantity: '5' },
    ]);
  });
});
