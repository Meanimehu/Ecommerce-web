import { describe, expect, it } from 'vitest';
import { AttributeType } from '@/features/catalogue/types';
import { attributeDefaults, attributeValues } from '@/features/product/hooks/use-attributes-form';
import {
  basicsDefaults,
  changedProduct,
  newProduct,
} from '@/features/product/hooks/use-basics-form';
import { changedVariant, newVariant } from '@/features/product/hooks/use-variant-form';
import {
  BasicsFormSchema,
  canEditProduct,
  canReviewProducts,
  dictionaryLabel,
  flattenCategories,
  isProductDecision,
  paiseToRupees,
  PhotoSize,
  photoSizeOf,
  ProductStatus,
  ProductStep,
  productStepFor,
  productStepToShow,
  rupeesToPaise,
  sortedPhotos,
  VariantFormSchema,
  type DictionaryCategory,
  type Photo,
  canEditRevision,
  changesPhotos,
  RevisionStatus,
  type Revision,
} from '@/features/product/types';

describe('money typed in rupees, sent in paise (D-15; Document 3, section 7)', () => {
  it('turns rupees into whole paise without floating point', () => {
    expect(rupeesToPaise('1499')).toBe(149900);
    expect(rupeesToPaise('1,499.5')).toBe(149950);
    expect(rupeesToPaise(' 0.07 ')).toBe(7);
    expect(rupeesToPaise('19.99')).toBe(1999);
  });

  it('refuses what is not an amount', () => {
    for (const notAnAmount of ['', 'abc', '1.234', '-5', '12e3', '₹10']) {
      expect(rupeesToPaise(notAnAmount)).toBeNull();
    }
  });

  it('shows paise back as rupees for the form', () => {
    expect(paiseToRupees(149900)).toBe('1499');
    expect(paiseToRupees(149950)).toBe('1499.50');
    expect(paiseToRupees(7)).toBe('0.07');
  });
});

describe('product form steps (Document 5, section 7.3)', () => {
  it('links each missing item to the step that fixes it', () => {
    expect(productStepFor('category_inactive')).toBe(ProductStep.Basics);
    expect(productStepFor('hsn_code:inactive')).toBe(ProductStep.Basics);
    expect(productStepFor('gst_rate')).toBe(ProductStep.Basics);
    expect(productStepFor('attributes')).toBe(ProductStep.Attributes);
    expect(productStepFor('variant')).toBe(ProductStep.Variants);
    expect(productStepFor('image')).toBe(ProductStep.Photos);
  });

  it('shows the step in the address, else the first thing missing, else the review', () => {
    expect(productStepToShow('photos', ['variant'])).toBe(ProductStep.Photos);
    expect(productStepToShow('nonsense', ['variant', 'image'])).toBe(ProductStep.Variants);
    expect(productStepToShow(null, [])).toBe(ProductStep.Review);
  });

  it('lets the vendor change a product only as a draft, rejected or unpublished', () => {
    expect(canEditProduct(ProductStatus.Draft)).toBe(true);
    expect(canEditProduct(ProductStatus.Rejected)).toBe(true);
    expect(canEditProduct(ProductStatus.Unpublished)).toBe(true);
    expect(canEditProduct(ProductStatus.Submitted)).toBe(false);
    expect(canEditProduct(ProductStatus.Approved)).toBe(false);
  });

  it('lists every category with its path, parents first', () => {
    const node = (
      id: string,
      name: string,
      children: DictionaryCategory[] = [],
    ): DictionaryCategory => ({
      id,
      name,
      slug: id,
      attributes: [],
      effectiveTax: { hsnCode: null, gstRateBps: null, inactive: [] },
      children,
    });
    const choices = flattenCategories([
      node('women', 'Women', [node('kurtas', 'Kurtas')]),
      node('men', 'Men'),
    ]);
    expect(choices.map((choice) => choice.path)).toEqual(['Women', 'Women › Kurtas', 'Men']);
  });

  it('names a size or colour by its label, or by its code when it is no longer offered', () => {
    const sizes = [{ code: 'M', label: 'Medium' }];
    expect(dictionaryLabel(sizes, 'M')).toBe('Medium');
    expect(dictionaryLabel(sizes, 'XXL')).toBe('XXL');
    expect(dictionaryLabel(sizes, null)).toBe('—');
  });
});

describe('what the product forms send (area-3b-products.md, sections 2 and 3)', () => {
  const basics = {
    title: 'Cotton kurta',
    categoryId: 'kurtas',
    brandId: '',
    description: '',
    hsnCode: '',
    gstRateBps: '',
  };

  it('a new draft sends what is filled, and the tax only as a pair', () => {
    expect(newProduct(basics)).toEqual({ title: 'Cotton kurta', categoryId: 'kurtas' });
    expect(
      newProduct({ ...basics, brandId: 'dhaaga', hsnCode: '6204', gstRateBps: '500' }),
    ).toEqual({
      title: 'Cotton kurta',
      categoryId: 'kurtas',
      brandId: 'dhaaga',
      hsnCode: '6204',
      gstRateBps: 500,
    });
  });

  it('a change sends only changed fields; emptied ones and the tax go back with null', () => {
    expect(changedProduct(basics, {})).toEqual({});
    expect(changedProduct(basics, { brandId: true, description: true, gstRateBps: true })).toEqual({
      brandId: null,
      description: null,
      hsnCode: null,
      gstRateBps: null,
    });
  });

  it('the tax is checked as a pair before anything is sent', () => {
    const result = BasicsFormSchema.safeParse({ ...basics, hsnCode: '6204' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['gstRateBps']);
  });

  it('attributes: every filled value is sent, a number as a number, an empty one left out', () => {
    const attributes = [
      { key: 'fabric', label: 'Fabric', type: AttributeType.Choice, required: true },
      { key: 'length', label: 'Length', type: AttributeType.Number, required: false },
      { key: 'weave', label: 'Weave', type: AttributeType.Text, required: false },
    ];
    expect(attributeValues({ fabric: 'Silk', length: ' 5.5 ', weave: '' }, attributes)).toEqual({
      fabric: 'Silk',
      length: 5.5,
    });
  });

  it('a variant: rupees are checked and turned into paise by the form', () => {
    const typed = { sizeCode: 'M', colourCode: '', sku: ' K-1 ', mrp: '1,999', price: '1499.5' };
    const values = VariantFormSchema.parse(typed);
    expect(newVariant(values)).toEqual({
      sizeCode: 'M',
      sku: 'K-1',
      mrpPaise: 199900,
      pricePaise: 149950,
    });
    expect(changedVariant(values, { colourCode: true, price: true })).toEqual({
      colourCode: null,
      pricePaise: 149950,
    });
    const wrong = VariantFormSchema.safeParse({ ...typed, price: '12e3', mrp: '' });
    expect(wrong.error?.issues.map((issue) => [issue.path[0], issue.message])).toEqual([
      ['mrp', 'validation.required'],
      ['price', 'validation.moneyShape'],
    ]);
  });
});

describe('photos and moderation', () => {
  const photo = (id: string, sortOrder: number | null, isCover = false): Photo => ({
    id,
    productId: 'product',
    sortOrder,
    isCover,
    altText: null,
    state: 'live',
  });

  it('shows the main photo first, then the vendor order', () => {
    const photos = [photo('b', 2), photo('c', 1), photo('a', 3, true)];
    expect(sortedPhotos(photos).map((sorted) => sorted.id)).toEqual(['a', 'c', 'b']);
  });

  it('asks for a stored photo size, or the medium one', () => {
    expect(photoSizeOf('thumb')).toBe(PhotoSize.Thumb);
    expect(photoSizeOf('large')).toBe(PhotoSize.Large);
    expect(photoSizeOf('huge')).toBe(PhotoSize.Medium);
    expect(photoSizeOf(null)).toBe(PhotoSize.Medium);
  });

  it('knows the two decisions, and who may make them', () => {
    expect(isProductDecision('approve')).toBe(true);
    expect(isProductDecision('reject')).toBe(true);
    expect(isProductDecision('delete')).toBe(false);
    expect(canReviewProducts(['moderator'])).toBe(true);
    expect(canReviewProducts(['customer', 'admin'])).toBe(true);
    expect(canReviewProducts(['customer', 'vendor_owner'])).toBe(false);
  });
});

describe('revisions (Document 5, section 7.3; area-3b-products.md, section 5)', () => {
  const revision = (photoChanges: Partial<Revision['photoChanges']>): Revision => ({
    status: RevisionStatus.Draft,
    reason: null,
    submittedAt: null,
    content: {
      categoryId: 'c1',
      brandId: null,
      title: 'Kurta',
      description: null,
      attributes: {},
      hsnCode: null,
      gstRateBps: null,
      taxSource: 'category_default',
    },
    changes: [],
    images: [],
    removed: [],
    photoChanges: { added: [], removed: [], reordered: false, altTextChanged: [], ...photoChanges },
    missing: [],
  });

  it('a draft or rejected revision can be edited; one waiting for review cannot', () => {
    expect(canEditRevision(RevisionStatus.Draft)).toBe(true);
    expect(canEditRevision(RevisionStatus.Rejected)).toBe(true);
    expect(canEditRevision(RevisionStatus.Submitted)).toBe(false);
  });

  it('knows when the photos change at all', () => {
    expect(changesPhotos(revision({}))).toBe(false);
    expect(changesPhotos(revision({ added: ['p1'] }))).toBe(true);
    expect(changesPhotos(revision({ reordered: true }))).toBe(true);
    expect(changesPhotos(revision({ altTextChanged: ['p2'] }))).toBe(true);
  });

  it('a revision starts from the same basics as the product, and sends only what changed', () => {
    const content = revision({}).content;
    expect(basicsDefaults(content)).toMatchObject({
      title: 'Kurta',
      categoryId: 'c1',
      hsnCode: '',
    });
    expect(attributeDefaults({ fit: 'Relaxed', size: null }, [])).toEqual({});
  });
});
