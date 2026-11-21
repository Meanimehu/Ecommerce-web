import { describe, expect, it } from 'vitest';
import {
  accountPath,
  addProductPath,
  adminCataloguePath,
  adminHomePath,
  adminVendorPath,
  adminVendorsPath,
  cartPath,
  categoryPath,
  homePath,
  loginPath,
  moderationProductPath,
  moderationQueuePath,
  myProductPath,
  myProductsPath,
  productPath,
  productSlug,
  samePageIn,
  vendorApplyPath,
  vendorHomePath,
  vendorProfilePath,
  myStockPath,
  bulkStockPath,
  variantStockPath,
  stockHistoryPath,
} from '@/lib/routes';

/**
 * Each helper gives exactly the address the screens wrote by hand before step 7 (Document 7,
 * 20.13), in both languages; the storefront's are the addresses of Document 4 (D4-02), from step 8.
 */
const ID = '01a1d4d5-73fb-7299-bb02-81bb43c19bf6';

describe('page addresses (lib/routes.ts)', () => {
  it('everyone: home, login with or without the page to return to, account', () => {
    expect(homePath('en')).toBe('/en');
    expect(homePath('hi')).toBe('/hi');
    expect(loginPath('en')).toBe('/en/login');
    expect(loginPath('hi', '/hi/vendor/apply?step=address')).toBe(
      '/hi/login?next=%2Fhi%2Fvendor%2Fapply%3Fstep%3Daddress',
    );
    expect(accountPath('en')).toBe('/en/account');
  });

  it('the storefront: the cart, a category, a product with its readable name (D4-02)', () => {
    expect(cartPath('en')).toBe('/en/cart');
    expect(categoryPath('hi', 'women-kurtas')).toBe('/hi/category/women-kurtas');
    expect(productPath('hi', ID, 'Slim Fit Chinos')).toBe(`/hi/product/${ID}/slim-fit-chinos`);
  });

  it('makes the readable part of a product address from the title, never empty', () => {
    expect(productSlug('Chanderi Cotton Anarkali Dress')).toBe('chanderi-cotton-anarkali-dress');
    expect(productSlug('  Kurta — Indigo / 100% cotton!  ')).toBe('kurta-indigo-100-cotton');
    expect(productSlug('Crème brûlée')).toBe('creme-brulee');
    expect(productSlug('कुर्ता')).toBe('product');
    expect(productSlug('a'.repeat(79) + ' b')).toBe('a'.repeat(79));
  });

  it('the vendor area: home, the application and its steps, products and their steps', () => {
    expect(vendorHomePath('en')).toBe('/en/vendor');
    expect(vendorApplyPath('en')).toBe('/en/vendor/apply');
    expect(vendorApplyPath('hi', 'documents')).toBe('/hi/vendor/apply?step=documents');
    expect(vendorProfilePath('hi')).toBe('/hi/vendor/profile');
    expect(myProductsPath('en')).toBe('/en/vendor/products');
    expect(myStockPath('en')).toBe('/en/vendor/stock');
    expect(bulkStockPath('hi')).toBe('/hi/vendor/stock/bulk');
    expect(variantStockPath('en', 'p1', 'v 2')).toBe('/en/vendor/stock/p1/v%202');
    expect(stockHistoryPath('en', 'p1', 'v2')).toBe('/en/vendor/stock/p1/v2/history');
    expect(addProductPath('hi')).toBe('/hi/vendor/products/add');
    expect(myProductPath('en', ID)).toBe(`/en/vendor/products/${ID}`);
    expect(myProductPath('en', ID, 'photos')).toBe(`/en/vendor/products/${ID}?step=photos`);
  });

  it('the admin area: home, vendors, the catalogue lists, moderation', () => {
    expect(adminHomePath('en')).toBe('/en/admin');
    expect(adminVendorsPath('en')).toBe('/en/admin/vendors');
    expect(adminVendorPath('hi', ID)).toBe(`/hi/admin/vendors/${ID}`);
    expect(adminCataloguePath('en')).toBe('/en/admin/catalogue');
    expect(adminCataloguePath('en', 'hsn-codes')).toBe('/en/admin/catalogue/hsn-codes');
    expect(moderationQueuePath('en')).toBe('/en/admin/moderation');
    expect(moderationProductPath('hi', ID)).toBe(`/hi/admin/moderation/${ID}`);
  });
});

describe('the same page in another language (the language switch)', () => {
  it('changes only the language part of the address', () => {
    expect(samePageIn('/en/category/women', 'hi')).toBe('/hi/category/women');
    expect(samePageIn('/hi/login', 'en')).toBe('/en/login');
    expect(samePageIn('/en', 'hi')).toBe('/hi');
    expect(samePageIn('/hi/vendor/products/abc', 'en')).toBe('/en/vendor/products/abc');
  });

  it('leaves an address with no language part as it is', () => {
    expect(samePageIn('/', 'hi')).toBe('/');
    expect(samePageIn('/english/page', 'hi')).toBe('/english/page');
  });
});
