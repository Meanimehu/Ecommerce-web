import { describe, expect, it } from 'vitest';
import { attributeBody, inTreeOrder, type Category } from '@/types/catalogue';
import { formatRate } from '@/utils/format';

const category = (id: string, parentId: string | null, name: string, sortOrder = 0): Category => ({
  id,
  parentId,
  name,
  slug: id,
  depth: parentId ? 2 : 1,
  attributeSchema: [],
  defaultHsnCode: null,
  defaultGstRateBps: null,
  sortOrder,
  isActive: true,
});

describe('catalogue lists (area-3a-catalogue.md)', () => {
  it('shows each category under its own parent, in order', () => {
    const list = [category('men', null, 'Men'), category('women', null, 'Women'), category('dresses', 'women', 'Dresses'), category('trousers', 'men', 'Trousers'), category('shirts', 'men', 'Shirts', -1)];
    expect(inTreeOrder(list).map((c) => c.id)).toEqual(['men', 'shirts', 'trousers', 'women', 'dresses']);
  });

  it('keeps a category whose parent is missing, at the top level', () => {
    expect(inTreeOrder([category('a', 'gone', 'A')]).map((c) => c.id)).toEqual(['a']);
  });

  it('sends options and filterable only for a choice attribute', () => {
    expect(attributeBody({ key: ' fit ', label: 'Fit', type: 'choice', required: true, options: 'Slim\n\n Regular \n', filterable: true })).toEqual({ key: 'fit', label: 'Fit', type: 'choice', required: true, options: ['Slim', 'Regular'], filterable: true });
    expect(attributeBody({ key: 'note', label: 'Note', type: 'text', required: false, options: 'x', filterable: true })).toEqual({ key: 'note', label: 'Note', type: 'text', required: false });
  });

  it('shows GST rates from basis points', () => {
    expect(formatRate(1200)).toBe('12%');
    expect(formatRate(250)).toBe('2.5%');
  });
});
