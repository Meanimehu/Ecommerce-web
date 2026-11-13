import { describe, expect, it } from 'vitest';
import { productStepFor } from '@/features/product/components/product-steps';
import { flattenCategories, paiseToRupees, rupeesToPaise, type DictionaryCategory } from '@/features/product/types';

describe('money typed in rupees, sent in paise (D-15; Document 3, section 7)', () => {
  it('turns rupees into whole paise without floating point', () => {
    expect(rupeesToPaise('1499')).toBe(149900);
    expect(rupeesToPaise('1,499.5')).toBe(149950);
    expect(rupeesToPaise(' 0.07 ')).toBe(7);
    expect(rupeesToPaise('19.99')).toBe(1999);
  });

  it('refuses what is not an amount', () => {
    for (const bad of ['', 'abc', '1.234', '-5', '12e3', '₹10']) expect(rupeesToPaise(bad)).toBeNull();
  });

  it('shows paise back as rupees for the form', () => {
    expect(paiseToRupees(149900)).toBe('1499');
    expect(paiseToRupees(149950)).toBe('1499.50');
    expect(paiseToRupees(7)).toBe('0.07');
  });
});

describe('product form (Document 5, section 7.3)', () => {
  it('links each missing item to the step that fixes it', () => {
    expect(productStepFor('category_inactive')).toBe('basics');
    expect(productStepFor('hsn_code:inactive')).toBe('basics');
    expect(productStepFor('gst_rate')).toBe('basics');
    expect(productStepFor('attributes')).toBe('attributes');
    expect(productStepFor('variant')).toBe('variants');
    expect(productStepFor('image')).toBe('photos');
  });

  it('lists every category with its path, parents first', () => {
    const node = (id: string, name: string, children: DictionaryCategory[] = []): DictionaryCategory => ({ id, name, slug: id, attributes: [], effectiveTax: { hsnCode: null, gstRateBps: null, inactive: [] }, children });
    const flat = flattenCategories([node('w', 'Women', [node('k', 'Kurtas')]), node('m', 'Men')]);
    expect(flat.map((c) => c.path)).toEqual(['Women', 'Women › Kurtas', 'Men']);
  });
});
