import { describe, expect, it, vi } from 'vitest';
import { boundedCache } from '@/utils/bounded-cache';
import { withQuery } from '@/utils/url';
import {
  activeFilterCount,
  backendFilters,
  categoryEntries,
  FilterGroup,
  isPlainList,
  listSearch,
  MAX_FILTER_VALUES,
  NO_FILTERS,
  ProductSort,
  readListFilters,
  readSearchText,
  withoutFilters,
  withToggled,
} from '@/features/storefront/product-list/rules';
import type { CategoryNode } from '@/features/storefront/product-list/types';

describe('the filters in a list address (Document 5, section 6.1)', () => {
  it('reads sizes, colours, brands, prices and the sort, each value once and in one order', () => {
    const filters = readListFilters({
      size: 'M,L, M',
      colour: ['NAVY', 'BLACK'],
      brand: 'b-2,b-1',
      minPrice: '500',
      maxPrice: '3000',
      sort: 'price_asc',
    });
    expect(filters).toEqual({
      sizes: ['L', 'M'],
      colours: ['BLACK', 'NAVY'],
      brandIds: ['b-1', 'b-2'],
      minRupees: 500,
      maxRupees: 3000,
      sort: ProductSort.PriceLowToHigh,
    });
  });

  it('leaves out what is not valid, and swaps a lowest price above the highest', () => {
    expect(readListFilters({ minPrice: '12.5', maxPrice: '-3', sort: 'cheapest' })).toEqual(
      NO_FILTERS,
    );
    const swapped = readListFilters({ minPrice: '900', maxPrice: '100' });
    expect([swapped.minRupees, swapped.maxRupees]).toEqual([100, 900]);
    expect(readListFilters({ maxPrice: '99999999' }).maxRupees).toBeNull();
  });

  it('keeps at most 20 filter values, so the backend never refuses the request', () => {
    const many = Array.from(
      { length: 30 },
      (_value, index) => `S${String(index).padStart(2, '0')}`,
    );
    const filters = readListFilters({ size: many.slice(0, 15).join(','), colour: many.join(',') });
    expect(filters.sizes).toHaveLength(15);
    expect(filters.sizes.length + filters.colours.length).toBe(MAX_FILTER_VALUES);
  });

  it('writes the same address for the same choice, whatever the order it was made in', () => {
    const first = withToggled(
      withToggled(NO_FILTERS, FilterGroup.Size, 'M'),
      FilterGroup.Size,
      'L',
    );
    const second = withToggled(
      withToggled(NO_FILTERS, FilterGroup.Size, 'L'),
      FilterGroup.Size,
      'M',
    );
    expect(withQuery('/en/category/kurtas', listSearch(first))).toBe(
      withQuery('/en/category/kurtas', listSearch(second)),
    );
    expect(withQuery('/en/category/kurtas', listSearch(first))).toBe(
      '/en/category/kurtas?size=L%2CM',
    );
    expect(withQuery('/en/category/kurtas', listSearch(NO_FILTERS))).toBe('/en/category/kurtas');
  });

  it('switches a value off again, counts the filters on and clears them', () => {
    const on = { ...withToggled(NO_FILTERS, FilterGroup.Colour, 'BLUE'), minRupees: 500 };
    expect(activeFilterCount(on)).toBe(2);
    expect(withToggled(on, FilterGroup.Colour, 'BLUE').colours).toEqual([]);
    const sorted = { ...on, sort: ProductSort.PriceHighToLow };
    expect(withoutFilters(sorted)).toEqual({ ...NO_FILTERS, sort: ProductSort.PriceHighToLow });
  });

  it('sends the backend comma lists and prices in paise', () => {
    expect(
      backendFilters({
        ...NO_FILTERS,
        sizes: ['L', 'M'],
        brandIds: ['b-1'],
        minRupees: 500,
        maxRupees: 3000,
      }),
    ).toEqual({
      size: 'L,M',
      colour: '',
      brandId: 'b-1',
      minPrice: 50000,
      maxPrice: 300000,
      sort: null,
    });
  });

  it('only a list with no filter and no order is the plain, indexed list (Document 4, D4-04)', () => {
    expect(isPlainList(NO_FILTERS)).toBe(true);
    expect(isPlainList({ ...NO_FILTERS, sort: ProductSort.Newest })).toBe(false);
    expect(isPlainList({ ...NO_FILTERS, sizes: ['M'] })).toBe(false);
  });
});

describe('the bounded cache for public list answers (Document 4, section 7)', () => {
  it('shares one call for the same key until its life ends', async () => {
    vi.useFakeTimers();
    const cached = boundedCache<number>({ lifeMs: 1000, maxEntries: 10 });
    const load = vi.fn(async () => 1);
    await cached('a', load);
    await cached('a', load);
    expect(load).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1001);
    await cached('a', load);
    expect(load).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('keeps at most the limit, dropping the oldest first, and never keeps a failure', async () => {
    const cached = boundedCache<string>({ lifeMs: 60_000, maxEntries: 2 });
    const load = vi.fn(async (key: string) => key);
    for (const key of ['a', 'b', 'c']) await cached(key, () => load(key));
    await cached('a', () => load('a'));
    expect(load).toHaveBeenCalledTimes(4);

    const failing = vi.fn(async () => {
      throw new Error('backend down');
    });
    await expect(cached('x', failing)).rejects.toThrow('backend down');
    await expect(cached('x', failing)).rejects.toThrow('backend down');
    expect(failing).toHaveBeenCalledTimes(2);
  });
});

describe('the home page category entries (Document 6, 7.4)', () => {
  const node = (slug: string, productCount: number, children: CategoryNode[] = []) => ({
    id: slug,
    name: slug,
    slug,
    productCount,
    children,
  });

  it('offers the second level, or a top level with nothing below it, only with products', () => {
    const tree = [
      node('women', 5, [node('kurtas', 5), node('sarees', 0)]),
      node('men', 0, [node('shirts', 0)]),
      node('gifts', 2),
      node('empty', 0),
    ];
    expect(categoryEntries(tree).map((entry) => entry.slug)).toEqual(['kurtas', 'gifts']);
  });
});

describe('the search text in the address', () => {
  it('is trimmed and cut to the 100 characters the backend takes', () => {
    expect(readSearchText('  kurta  ')).toBe('kurta');
    expect(readSearchText(['silk', 'cotton'])).toBe('silk');
    expect(readSearchText(undefined)).toBe('');
    expect(readSearchText('x'.repeat(150))).toHaveLength(100);
  });
});
