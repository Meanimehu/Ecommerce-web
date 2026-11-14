import { describe, expect, it } from 'vitest';
import { changedBrand, newBrand } from '@/features/catalogue/hooks/use-brand-form';
import {
  changedCategory,
  newCategory,
  pathOf,
  possibleParents,
} from '@/features/catalogue/hooks/use-category-form';
import { changedColour, newColour } from '@/features/catalogue/hooks/use-colour-form';
import { changedHsnCode, newHsnCode } from '@/features/catalogue/hooks/use-hsn-code-form';
import { changedSize, newSize } from '@/features/catalogue/hooks/use-size-form';
import {
  AttributeType,
  attributeBody,
  inTreeOrder,
  rateField,
  rateValue,
  SizeGroup,
  type Category,
} from '@/features/catalogue/types';
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
    const list = [
      category('men', null, 'Men'),
      category('women', null, 'Women'),
      category('dresses', 'women', 'Dresses'),
      category('trousers', 'men', 'Trousers'),
      category('shirts', 'men', 'Shirts', -1),
    ];
    expect(inTreeOrder(list).map((node) => node.id)).toEqual([
      'men',
      'shirts',
      'trousers',
      'women',
      'dresses',
    ]);
  });

  it('keeps a category whose parent is missing, at the top level', () => {
    expect(inTreeOrder([category('a', 'gone', 'A')]).map((node) => node.id)).toEqual(['a']);
  });

  it('sends options and filterable only for a choice attribute', () => {
    expect(
      attributeBody({
        key: ' fit ',
        label: 'Fit',
        type: AttributeType.Choice,
        required: true,
        options: 'Slim\n\n Regular \n',
        filterable: true,
      }),
    ).toEqual({
      key: 'fit',
      label: 'Fit',
      type: AttributeType.Choice,
      required: true,
      options: ['Slim', 'Regular'],
      filterable: true,
    });
    expect(
      attributeBody({
        key: 'note',
        label: 'Note',
        type: AttributeType.Text,
        required: false,
        options: 'x',
        filterable: true,
      }),
    ).toEqual({ key: 'note', label: 'Note', type: AttributeType.Text, required: false });
  });

  it('shows GST rates from basis points', () => {
    expect(formatRate(1200)).toBe('12%');
    expect(formatRate(250)).toBe('2.5%');
  });
});

describe('what each catalogue form sends (area-3a-catalogue.md, sections 3 to 6)', () => {
  it('an HSN code: a new one leaves out an empty rate; a change sends only the changed fields', () => {
    const values = { code: '6204', description: 'Women’s suits', defaultGstRateBps: '' };
    expect(newHsnCode(values)).toEqual({ code: '6204', description: 'Women’s suits' });
    expect(newHsnCode({ ...values, defaultGstRateBps: '500' }).defaultGstRateBps).toBe(500);
    expect(changedHsnCode(values, { defaultGstRateBps: true })).toEqual({
      defaultGstRateBps: null,
    });
    expect(changedHsnCode(values, {})).toEqual({});
  });

  it('a brand: an empty slug is left out, so the backend makes one', () => {
    expect(newBrand({ name: 'Dhaaga Basics', slug: '' })).toEqual({ name: 'Dhaaga Basics' });
    expect(changedBrand({ name: 'Dhaaga Basics', slug: '' }, { slug: true })).toEqual({});
  });

  it('a size: the order is a number, and an empty order is left out', () => {
    const values = {
      code: 'XL',
      label: 'Extra large',
      sizeGroup: SizeGroup.Apparel,
      sortOrder: '',
    };
    expect(newSize(values)).toEqual({ code: 'XL', label: 'Extra large', sizeGroup: 'apparel' });
    expect(changedSize({ ...values, sortOrder: '40' }, { sortOrder: true })).toEqual({
      sortOrder: 40,
    });
  });

  it('a colour: an emptied hex value is removed with null; the code is never sent on a change', () => {
    const values = { code: 'MAROON', label: 'Maroon', hex: '' };
    expect(newColour(values)).toEqual({ code: 'MAROON', label: 'Maroon' });
    expect(changedColour(values, { code: true, hex: true })).toEqual({ hex: null });
  });

  it('a category: a new one sends what is filled; a change clears a parent with null', () => {
    const values = {
      name: 'Kurtas',
      parentId: '',
      slug: '',
      defaultHsnCode: '',
      defaultGstRateBps: '',
      sortOrder: '',
      attributes: [],
    };
    expect(newCategory(values)).toEqual({ name: 'Kurtas' });
    expect(newCategory({ ...values, parentId: 'women', sortOrder: '2' })).toEqual({
      name: 'Kurtas',
      parentId: 'women',
      sortOrder: 2,
    });
    expect(changedCategory(values, { parentId: true, defaultHsnCode: true })).toEqual({
      parentId: null,
      defaultHsnCode: null,
    });
  });

  it('a category cannot move under itself, its own sub-categories, or the deepest level', () => {
    const women = category('women', null, 'Women');
    const ethnic = { ...category('ethnic', 'women', 'Ethnic'), depth: 2 };
    const kurtas = { ...category('kurtas', 'ethnic', 'Kurtas'), depth: 3 };
    const short = { ...category('short', 'kurtas', 'Short kurtas'), depth: 4 };
    const tree = [women, ethnic, kurtas, short];
    expect(possibleParents(tree, ethnic).map((parent) => parent.id)).toEqual(['women']);
    expect(possibleParents(tree).map((parent) => parent.id)).toEqual(['women', 'ethnic', 'kurtas']);
    expect(pathOf(kurtas, tree)).toBe('Women › Ethnic › Kurtas');
  });

  it('turns rates between basis points and a select value', () => {
    expect(rateField(null)).toBe('');
    expect(rateField(1200)).toBe('1200');
    expect(rateValue('')).toBeNull();
    expect(rateValue('1200')).toBe(1200);
  });
});
