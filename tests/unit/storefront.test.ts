import { describe, expect, it } from 'vitest';
import { findInTree } from '@/features/storefront/product-list/rules';
import type { CategoryNode } from '@/features/storefront/product-list/types';
import {
  categoryTrail,
  chosenVariant,
  isAvailable,
  MissingChoice,
  missingChoiceOf,
  sizesOf,
  StockLevel,
  stockLevelOf,
} from '@/features/storefront/product-page/rules';
import type { ProductDetail, PublicVariant } from '@/features/storefront/product-page/types';

const variant = (
  id: string,
  sizeCode: string | null,
  colourCode: string | null,
  inStock = true,
): PublicVariant => ({
  id,
  sku: id,
  size: sizeCode ? { code: sizeCode, label: sizeCode } : null,
  colour: colourCode ? { code: colourCode, label: colourCode, hex: null } : null,
  pricePaise: 99900,
  mrpPaise: 149900,
  discountPercent: 33,
  inStock,
  lowStock: false,
  onSale: false,
  saleEndsAt: null,
});

describe('choosing a variant (Document 5, section 6.2)', () => {
  const variants = [
    variant('s-black', 'S', 'BLACK'),
    variant('m-black', 'M', 'BLACK', false),
    variant('m-red', 'M', 'RED'),
  ];

  it('lists each size once, in the order the variants give them', () => {
    expect(sizesOf(variants).map((size) => size.code)).toEqual(['S', 'M']);
  });

  it('points at a variant only when every needed choice is made', () => {
    expect(chosenVariant(variants, { sizeCode: 'S', colourCode: null })).toBeNull();
    expect(chosenVariant(variants, { sizeCode: 'M', colourCode: 'RED' })?.id).toBe('m-red');
    const oneSizeOnly = [variant('free', null, 'BLACK')];
    expect(chosenVariant(oneSizeOnly, { sizeCode: null, colourCode: 'BLACK' })?.id).toBe('free');
  });

  it('a size or colour is available only when a variant in stock has it with the other choice', () => {
    expect(isAvailable(variants, { sizeCode: 'M', colourCode: 'BLACK' })).toBe(false);
    expect(isAvailable(variants, { sizeCode: 'M', colourCode: null })).toBe(true);
    expect(isAvailable(variants, { sizeCode: 'S', colourCode: 'RED' })).toBe(false);
  });

  it('says what is still to choose', () => {
    expect(missingChoiceOf(variants, { sizeCode: null, colourCode: null })).toBe(
      MissingChoice.SizeAndColour,
    );
    expect(missingChoiceOf(variants, { sizeCode: null, colourCode: 'RED' })).toBe(
      MissingChoice.Size,
    );
    expect(missingChoiceOf(variants, { sizeCode: 'S', colourCode: null })).toBe(
      MissingChoice.Colour,
    );
    expect(missingChoiceOf(variants, { sizeCode: 'S', colourCode: 'BLACK' })).toBeNull();
  });

  it('tells in stock, low and out of stock apart', () => {
    expect(stockLevelOf({ inStock: true, lowStock: false })).toBe(StockLevel.InStock);
    expect(stockLevelOf({ inStock: true, lowStock: true })).toBe(StockLevel.Low);
    expect(stockLevelOf({ inStock: false, lowStock: true })).toBe(StockLevel.Out);
  });
});

describe('where a category or product sits (Document 5, sections 6.1 and 6.2)', () => {
  const node = (slug: string, children: CategoryNode[] = []): CategoryNode => ({
    id: slug,
    name: slug,
    slug,
    productCount: 0,
    children,
  });

  it('finds a category and the path down to it', () => {
    const tree = [node('women', [node('kurtas')]), node('men')];
    expect(
      findInTree(tree, (found) => found.slug === 'kurtas')?.map((found) => found.slug),
    ).toEqual(['women', 'kurtas']);
    expect(findInTree(tree, (found) => found.slug === 'nothing')).toBeNull();
  });

  it("adds the product's own category to its breadcrumbs when the path does not hold it", () => {
    const women = { id: 'women', name: 'Women', slug: 'women' };
    const kurtas = { id: 'kurtas', name: 'Kurtas', slug: 'kurtas' };
    const product = { category: kurtas, categoryPath: [women] } as ProductDetail;
    expect(categoryTrail(product).map((crumb) => crumb.slug)).toEqual(['women', 'kurtas']);
    expect(
      categoryTrail({ ...product, categoryPath: [women, kurtas] }).map((crumb) => crumb.slug),
    ).toEqual(['women', 'kurtas']);
  });
});
