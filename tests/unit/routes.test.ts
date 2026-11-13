import { describe, expect, it } from 'vitest';
import {
  accountPath,
  addProductPath,
  adminCataloguePath,
  adminHomePath,
  adminVendorPath,
  adminVendorsPath,
  homePath,
  loginPath,
  moderationProductPath,
  moderationQueuePath,
  myProductPath,
  myProductsPath,
  vendorApplyPath,
  vendorHomePath,
} from '@/lib/routes';

/**
 * Each helper gives exactly the address the screens wrote by hand before step 7 (Document 7,
 * 20.13), in both languages.
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

  it('the vendor area: home, the application and its steps, products and their steps', () => {
    expect(vendorHomePath('en')).toBe('/en/vendor');
    expect(vendorApplyPath('en')).toBe('/en/vendor/apply');
    expect(vendorApplyPath('hi', 'documents')).toBe('/hi/vendor/apply?step=documents');
    expect(myProductsPath('en')).toBe('/en/vendor/products');
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
