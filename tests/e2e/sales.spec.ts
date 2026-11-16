import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { admin, backend, draftWithTwoVariants } from './support/products';
import { nextRequestBody } from './support/requests';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Slice 4d (Document 5, section 8.2; approved Stage 5 Vendor area screens, Sales): the list of
 * sale prices with its status filter, a new sale (price in rupees, times in IST, the backend's
 * refusals under their fields), cancelling one, and the read-only list of a vendor that is not
 * approved. Each test makes its own vendor and product. Against the real local backend; skipped
 * where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const HOUR_MS = 3_600_000;

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const toast = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });
const saleRow = (page: Page, sku: string) => page.getByRole('row').filter({ hasText: sku });

/** A date-and-time box's value in IST, some hours from now, on a whole hour. */
function istBoxValue(hoursFromNow: number): string {
  const time = Math.ceil(Date.now() / HOUR_MS) * HOUR_MS + hoursFromNow * HOUR_MS;
  return new Date(time + (5 * 60 + 30) * 60_000).toISOString().slice(0, 16);
}

test.describe('sales', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('a new sale: the normal price, refusals under their fields, the times sent from IST, then cancelled', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Approved);
    await page.setViewportSize(WIDE);
    const { variants } = await draftWithTwoVariants(page, `Sale kurta ${Date.now()}`);
    const [first] = variants;

    await page.goto('/en/vendor/sales');
    await expect(page.getByRole('heading', { name: 'Sales', level: 1 })).toBeVisible();
    await expect(page.getByText('No sales yet')).toBeVisible();
    await expect(page.locator('aside').getByRole('link', { name: 'Sales' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await noAxeViolations(page);

    await page.getByRole('link', { name: 'New sale' }).click();
    await expect(page.getByRole('heading', { name: 'New sale', level: 1 })).toBeVisible();
    await page.getByLabel('Variant').selectOption(first?.id ?? '');
    await expect(page.getByText('Normal price: ₹1,499')).toBeVisible();

    // Not below the normal price: the backend refuses, and says so under the price.
    await page.getByLabel('Sale price (₹)').fill('1600');
    await page.getByRole('button', { name: 'Create sale' }).click();
    await expect(
      page.getByText('The sale price must be below the normal price.').first(),
    ).toBeVisible();
    await expect(page.getByLabel('Sale price (₹)')).toHaveAttribute('aria-invalid', 'true');
    await noAxeViolations(page);

    // A good sale: the price in paise, the IST times as ISO times.
    const startsAt = istBoxValue(2);
    const endsAt = istBoxValue(26);
    await page.getByLabel('Sale price (₹)').fill('1299');
    await page.getByLabel('Starts').fill(startsAt);
    await page.getByLabel('Ends').fill(endsAt);
    const sent = nextRequestBody(page, 'POST', /^\/api\/vendors\/me\/sales$/);
    await page.getByRole('button', { name: 'Create sale' }).click();
    expect(await sent).toEqual({
      variantId: first?.id,
      salePricePaise: 129900,
      startsAt: new Date(`${startsAt}:00+05:30`).toISOString(),
      endsAt: new Date(`${endsAt}:00+05:30`).toISOString(),
    });
    await expect(toast(page, 'Sale created')).toBeVisible();
    await expect(page).toHaveURL(/\/en\/vendor\/sales$/);
    const row = saleRow(page, first?.sku ?? '');
    await expect(row).toContainText('₹1,299');
    await expect(row).toContainText('Upcoming');

    // The same variant in the same hours is refused.
    await page.goto('/en/vendor/sales/new');
    await page.getByLabel('Variant').selectOption(first?.id ?? '');
    await page.getByLabel('Sale price (₹)').fill('1199');
    await page.getByLabel('Starts').fill(startsAt);
    await page.getByLabel('Ends').fill(endsAt);
    await page.getByRole('button', { name: 'Create sale' }).click();
    await expect(
      page.getByText('This variant already has a sale at that time.').first(),
    ).toBeVisible();

    // Cancelling asks first; the sale then shows as cancelled, also under its filter.
    await page.goto('/en/vendor/sales');
    await saleRow(page, first?.sku ?? '')
      .getByRole('button', { name: /^Cancel sale/ })
      .click();
    const confirm = page.getByRole('alertdialog', { name: 'Cancel this sale?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Cancel sale' }).click();
    await expect(toast(page, 'Sale cancelled')).toBeVisible();
    await expect(saleRow(page, first?.sku ?? '')).toContainText('Cancelled');
    await page.getByLabel('Status').selectOption('cancelled');
    await page.getByRole('button', { name: 'Show' }).click();
    await expect(page).toHaveURL(/\/en\/vendor\/sales\?status=cancelled$/);
    await expect(saleRow(page, first?.sku ?? '')).toBeVisible();
    await page.goto('/en/vendor/sales?status=active');
    await expect(page.getByText('No sales with this status')).toBeVisible();
  });

  test('a vendor that is not approved reads its sales and changes nothing; the list in Hindi', async ({
    browser,
  }) => {
    const made = await vendorIn(browser, MadeStatus.Approved);
    const { page } = made;
    await page.setViewportSize(WIDE);
    const { variants } = await draftWithTwoVariants(page, `Paused sale kurta ${Date.now()}`);
    await backend(page, 'POST', '/vendors/me/sales', {
      variantId: variants[0]?.id,
      salePricePaise: 99900,
      startsAt: new Date(Date.now() + 60_000).toISOString(),
      endsAt: new Date(Date.now() + 48 * HOUR_MS).toISOString(),
    });
    await backend(await admin(browser), 'POST', `/admin/vendors/${made.id}/suspend`, {
      reason: 'Test: paused.',
    });
    await page.goto('/en/vendor/sales');
    await expect(saleRow(page, variants[0]?.sku ?? '')).toContainText('₹999');
    await expect(page.getByRole('link', { name: 'New sale' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Cancel sale/ })).toHaveCount(0);

    await page.goto('/hi/vendor/sales');
    await expect(page.getByRole('heading', { name: 'सेल', level: 1 })).toBeVisible();
    await expect(saleRow(page, variants[0]?.sku ?? '')).toContainText('आने वाली');
    await noAxeViolations(page);
  });
});
