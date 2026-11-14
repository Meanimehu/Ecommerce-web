import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { addAndSubmitProduct as addAndSubmit } from './support/flows';
import { backendLog, freshPhone, pageAs } from './support/login';
import { nextRequestBody } from './support/requests';

/**
 * Slice 2c (Document 8, Slice 2): an approved vendor adds a product with a variant and photos and submits it; a
 * moderator approves it, or rejects another with a reason the vendor then reads. Against the real local backend
 * (sample data: an approved vendor, a moderator, the category Women › Kurtas); skipped where it is not running.
 */
const VENDOR_PHONE = process.env.E2E_VENDOR_PHONE ?? '9000000011';
const MODERATOR_PHONE = process.env.E2E_MODERATOR_PHONE ?? '9000000002';
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

test.describe('vendor products and moderation', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('a vendor adds a product step by step, and a moderator approves it', async ({ browser }) => {
    const stamp = String(Date.now()).slice(-7);
    const vendor = await pageAs(browser, VENDOR_PHONE, '/en/vendor/products');
    await expect(vendor.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();
    await noAxeViolations(vendor);

    // Step 1 checks before sending; the tax comes from the category unless both parts are chosen.
    await vendor.getByRole('link', { name: 'Add product' }).click();
    await vendor.getByRole('button', { name: 'Save and continue' }).click();
    await expect(
      vendor.getByRole('alert').filter({ hasText: /Fix \d things to continue/ }),
    ).toBeFocused();
    await noAxeViolations(vendor);

    // A price over the MRP is refused by the backend and shown under the price.
    await vendor.getByRole('textbox', { name: 'Title' }).fill(`Test kurta ${stamp}`);
    await vendor
      .getByRole('combobox', { name: 'Category' })
      .selectOption({ label: 'Women › Kurtas' });
    await vendor.getByRole('button', { name: 'Save and continue' }).click();
    await expect(vendor).toHaveURL(/step=attributes/);
    await expect(vendor.getByText('This category asks for no details.')).toBeVisible();
    await vendor.getByRole('link', { name: 'Continue' }).click();
    await vendor.getByRole('textbox', { name: 'SKU' }).fill(`T${stamp}-X`);
    await vendor.getByRole('textbox', { name: 'MRP (₹)' }).fill('999');
    await vendor.getByRole('textbox', { name: 'Selling price (₹)' }).fill('1499');
    await vendor.getByRole('button', { name: 'Save variant' }).click();
    await expect(vendor.getByRole('textbox', { name: 'Selling price (₹)' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await noAxeViolations(vendor);
    await vendor
      .getByRole('link', { name: /Review/ })
      .first()
      .click();
    await expect(vendor.getByText('At least one variant that is on: missing')).toBeVisible();
    await noAxeViolations(vendor);

    // Editing the saved draft and a saved variant sends exactly the changed field, and the change is kept
    // (Document 7, 20.12).
    const draft = vendor.url().replace(/\?.*$/, '');
    await vendor.goto(`${draft}?step=basics`);
    await vendor.getByRole('textbox', { name: 'Title' }).fill(`Test kurta ${stamp} edited`);
    const sentTitle = nextRequestBody(vendor, 'PATCH', /^\/api\/vendors\/me\/products\/[^/]+$/);
    await vendor.getByRole('button', { name: 'Save and continue' }).click();
    expect(await sentTitle).toEqual({ title: `Test kurta ${stamp} edited` });
    await expect(vendor).toHaveURL(/step=attributes/);
    await vendor.reload();
    await expect(
      vendor.getByRole('heading', { name: `Test kurta ${stamp} edited`, level: 1 }),
    ).toBeVisible();
    await vendor.goto(`${draft}?step=variants`);
    await vendor.getByRole('textbox', { name: 'SKU' }).fill(`T${stamp}-E`);
    await vendor.getByRole('textbox', { name: 'MRP (₹)' }).fill('999');
    await vendor.getByRole('textbox', { name: 'Selling price (₹)' }).fill('899');
    await vendor.getByRole('button', { name: 'Save variant' }).click();
    await expect(
      vendor.getByText('₹899', { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible();
    await vendor.getByRole('button', { name: new RegExp(`^Edit\\s*: .*T${stamp}-E$`) }).click();
    await vendor.getByRole('textbox', { name: 'Selling price (₹)' }).fill('799');
    const sentPrice = nextRequestBody(
      vendor,
      'PATCH',
      /^\/api\/vendors\/me\/products\/[^/]+\/variants\/[^/]+$/,
    );
    await vendor.getByRole('button', { name: 'Save variant' }).click();
    expect(await sentPrice).toEqual({ pricePaise: 79900 });
    await vendor.reload();
    await expect(
      vendor.getByText('₹799', { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible();

    // The full path, then the moderator.
    const title = `Test kurta ${stamp} full`;
    const address = await addAndSubmit(vendor, title, `T${stamp}-M`);
    await noAxeViolations(vendor);

    const moderator = await pageAs(browser, MODERATOR_PHONE, '/en/admin/moderation');
    await expect(
      moderator.getByRole('heading', { name: 'Product moderation', level: 1 }),
    ).toBeVisible();
    await noAxeViolations(moderator);
    await moderator.goto(`/en/admin/moderation/${address.split('/').pop()}`);
    await expect(moderator.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    // Photos under review come through our server (D3-04).
    const photo = moderator.locator('img').first();
    await expect(photo).toHaveAttribute('src', /^\/api\/moderation\/products\//);
    await expect
      .poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    await noAxeViolations(moderator);
    await moderator.getByRole('button', { name: 'Approve product' }).click();
    await expect(
      moderator.getByRole('status').filter({ hasText: 'Product approved' }),
    ).toBeVisible();

    await vendor.goto(address);
    await expect(vendor.getByText('Approved', { exact: true })).toBeVisible();
  });

  test('a moderator rejects a product with a reason, and the vendor reads it', async ({
    browser,
  }) => {
    const stamp = String(Date.now()).slice(-7);
    const vendor = await pageAs(browser, VENDOR_PHONE, '/en/vendor/products');
    const address = await addAndSubmit(vendor, `Reject kurta ${stamp}`, `R${stamp}-M`);
    const moderator = await pageAs(
      browser,
      MODERATOR_PHONE,
      `/en/admin/moderation/${address.split('/').pop()}`,
    );
    await moderator.getByRole('button', { name: 'Reject', exact: true }).click();
    const dialog = moderator.getByRole('alertdialog');
    await dialog.getByLabel('Reason (the vendor can read it)').fill('The main photo is blurry.');
    await dialog.getByRole('button', { name: 'Reject product' }).click();
    await expect(
      moderator.getByRole('status').filter({ hasText: 'Product rejected' }),
    ).toBeVisible();

    await vendor.goto(address);
    await expect(vendor.getByText('The main photo is blurry.')).toBeVisible();
    await expect(vendor.getByRole('navigation', { name: 'Product steps' })).toBeVisible();
    await noAxeViolations(vendor);
  });

  test('when the backend refuses a rejection, the reason dialog stays open with the error and the reason kept; trying again closes it', async ({
    browser,
  }) => {
    const stamp = String(Date.now()).slice(-7);
    const vendor = await pageAs(browser, VENDOR_PHONE, '/en/vendor/products');
    const address = await addAndSubmit(vendor, `Refused kurta ${stamp}`, `F${stamp}-M`);
    const moderator = await pageAs(
      browser,
      MODERATOR_PHONE,
      `/en/admin/moderation/${address.split('/').pop()}`,
    );
    // The first try is refused by the server; the second goes through.
    await moderator.route('**/reject', (route) =>
      route.fulfill({
        status: 503,
        json: { error: { code: 'SERVICE_UNAVAILABLE', requestId: 'req-e2e' } },
      }),
    );
    await moderator.getByRole('button', { name: 'Reject', exact: true }).click();
    const dialog = moderator.getByRole('alertdialog');
    const reason = dialog.getByLabel('Reason (the vendor can read it)');
    await reason.fill('The colour in the photos does not match the title.');
    const confirm = dialog.getByRole('button', { name: 'Reject product' });
    await confirm.click();
    const summary = dialog.getByRole('alert').filter({ hasText: 'Fix 1 thing to continue' });
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(dialog).toBeVisible();
    await expect(reason).toHaveValue('The colour in the photos does not match the title.');
    await expect(confirm).toBeEnabled();
    await expect(confirm).not.toHaveAttribute('aria-busy', 'true');

    await moderator.unroute('**/reject');
    await confirm.click();
    await expect(dialog).toBeHidden();
    await expect(
      moderator.getByRole('status').filter({ hasText: 'Product rejected' }),
    ).toBeVisible();
  });

  test('a customer gets a real 403 on moderation, and a person with no vendor is sent to the application', async ({
    browser,
  }) => {
    const customer = await pageAs(browser, freshPhone(), '/en/account');
    expect((await customer.goto('/en/admin/moderation'))?.status()).toBe(403);
    await customer.goto('/en/vendor/products');
    await expect(customer).toHaveURL(/\/en\/vendor\/apply$/);
  });
});
