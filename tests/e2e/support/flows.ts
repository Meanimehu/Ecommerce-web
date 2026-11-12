import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import { TEST_PDF } from './files';

/** Whole steps that several end-to-end tests go through, the way a person does them on the screens. */

export const KURTA_PHOTO = { name: 'kurta.png', mimeType: 'image/png', buffer: readFileSync('tests/e2e/fixtures/garment-kurta.png') };
export const SHIRT_PHOTO = { name: 'shirt.png', mimeType: 'image/png', buffer: readFileSync('tests/e2e/fixtures/garment-shirt.png') };

/** A person with no vendor fills in every step of the application and submits it (Document 5, section 7.1). */
export async function applyAsVendor(page: Page, shop: string, phone: string) {
  await page.goto('/en/vendor/apply?step=details');
  await page.getByLabel('Seller type').selectOption('proprietorship');
  await page.getByLabel('Legal name').fill(`${shop} Proprietorship`);
  await page.getByLabel('Shop name').fill(shop);
  await page.getByLabel('Contact email').fill(`owner${phone.slice(-4)}@example.com`);
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page).toHaveURL(/step=address/);
  await page.getByLabel('Address line 1').fill('12 MG Road');
  await page.getByLabel('City').fill('Jaipur');
  await page.getByLabel('State').fill('Rajasthan');
  await page.getByLabel('Pin code').fill('302001');
  await page.getByLabel('Contact phone').fill(phone);
  await page.getByRole('button', { name: 'Save address' }).click();
  await expect(page.getByText('12 MG Road, Jaipur, Rajasthan, 302001')).toBeVisible();
  await page.goto('/en/vendor/apply?step=documents');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /^Add file\s*: PAN card$/ }).click();
  await (await chooser).setFiles({ name: 'pan.pdf', mimeType: 'application/pdf', buffer: TEST_PDF });
  await expect(page.getByText(/^pan\.pdf · /)).toBeVisible();
  await page.goto('/en/vendor/apply?step=review');
  await page.getByLabel('I have read and agree to the vendor terms').check();
  await page.getByRole('button', { name: 'Submit application' }).click();
  await expect(page.getByText('Waiting for review')).toBeVisible();
}

/** An admin approves the vendor's documents, then the vendor (Document 5, section 8.3). */
export async function approveVendor(admin: Page, shop: string) {
  await admin.goto(`/en/admin/vendors?status=submitted&q=${encodeURIComponent(shop)}`);
  await admin.getByRole('link', { name: shop }).first().click();
  await admin.getByRole('button', { name: /^Approve\s*: PAN card$/ }).click();
  await expect(admin.getByRole('status').filter({ hasText: 'Document approved' })).toBeVisible();
  await admin.getByRole('button', { name: 'Approve vendor' }).click();
  await expect(admin.getByRole('status').filter({ hasText: 'Vendor approved' })).toBeVisible();
}

/** An approved vendor adds a product through every step (size M, ₹1,999 MRP, ₹1,499.50) and submits it. Returns its address. */
export async function addAndSubmitProduct(vendor: Page, title: string, sku: string): Promise<string> {
  await vendor.goto('/en/vendor/products/new');
  await vendor.getByRole('textbox', { name: 'Title' }).fill(title);
  await vendor.getByRole('combobox', { name: 'Category' }).selectOption({ label: 'Women › Kurtas' });
  await expect(vendor.getByText(/The category's default: HSN \d+, GST \d+%/)).toBeVisible();
  await vendor.getByRole('button', { name: 'Save and continue' }).click();
  await expect(vendor).toHaveURL(/\/en\/vendor\/products\/[0-9a-f-]+\?step=attributes$/);
  const address = vendor.url().replace(/\?.*$/, '');

  await vendor.getByRole('link', { name: 'Continue' }).click();
  await expect(vendor).toHaveURL(/step=variants/);
  await vendor.getByRole('combobox', { name: /^Size/ }).selectOption({ label: 'M' });
  await vendor.getByRole('textbox', { name: 'SKU' }).fill(sku);
  await vendor.getByRole('textbox', { name: 'MRP (₹)' }).fill('1999');
  await vendor.getByRole('textbox', { name: 'Selling price (₹)' }).fill('1499.50');
  await vendor.getByRole('button', { name: 'Save variant' }).click();
  await expect(vendor.getByText('₹1,499.50', { exact: true }).filter({ visible: true })).toBeVisible();
  await vendor.getByRole('link', { name: 'Continue' }).click();

  await expect(vendor).toHaveURL(/step=photos/);
  const chooser = vendor.waitForEvent('filechooser');
  await vendor.getByRole('button', { name: 'Choose files' }).click();
  await (await chooser).setFiles([KURTA_PHOTO, SHIRT_PHOTO]);
  await expect(vendor.getByText('Main photo', { exact: true })).toBeVisible();
  await expect(vendor.getByText('Photo 2', { exact: true })).toBeVisible();
  await vendor.getByRole('link', { name: 'Continue' }).click();

  await expect(vendor).toHaveURL(/step=review/);
  await expect(vendor.getByText('Everything needed is here.')).toBeVisible();
  await vendor.getByRole('button', { name: 'Submit for review' }).click();
  await expect(vendor.getByText('This product is waiting for review and cannot be changed until a moderator decides.')).toBeVisible();
  return address;
}

/** A moderator approves a submitted product. */
export async function approveProduct(moderator: Page, productId: string) {
  await moderator.goto(`/en/admin/moderation/${productId}`);
  await moderator.getByRole('button', { name: 'Approve product' }).click();
  await expect(moderator.getByRole('status').filter({ hasText: 'Product approved' })).toBeVisible();
}
