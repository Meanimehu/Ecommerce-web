import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { admin, backend, draftWithTwoVariants } from './support/products';
import { nextRequestBody } from './support/requests';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Slice 4b (Document 5, section 7.4; approved Stage 5 Vendor area screens): the stock list with its
 * summary and state filter, changing one variant (set, add, remove, the threshold), its history,
 * the bulk update by SKU (all or nothing), and the read-only stock of a vendor that is not
 * approved. Each test makes its own vendor and product. Against the real local backend; skipped
 * where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const toast = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });

/** A table row of the stock list, found by its SKU (wide screens draw a real table). */
const stockRow = (page: Page, sku: string) => page.getByRole('row').filter({ hasText: sku });

test.describe('stock', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('the list, one variant changed (set, remove, a refused remove, the threshold) and its history', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Approved);
    await page.setViewportSize(WIDE);
    const { variants } = await draftWithTwoVariants(page, `Stock kurta ${Date.now()}`);
    const [first, second] = variants;

    // The list: both variants start at 0, so both are out.
    await page.goto('/en/vendor/stock');
    await expect(page.getByRole('heading', { name: 'Stock', level: 1 })).toBeVisible();
    const summary = page.getByRole('region', { name: 'Stock summary' });
    await expect(summary).toContainText('Out2');
    await expect(stockRow(page, first?.sku ?? '')).toContainText('Out');
    await expect(page.locator('aside').getByRole('link', { name: 'Stock' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await noAxeViolations(page);

    // The state filter is kept in the address; a state with nothing in it says so.
    await page.getByLabel('State').selectOption('low');
    await page.getByRole('button', { name: 'Show' }).click();
    await expect(page).toHaveURL(/\/en\/vendor\/stock\?status=low$/);
    await expect(page.getByText('No variants in this state')).toBeVisible();
    await page.goto('/en/vendor/stock?status=out');
    await expect(page.getByRole('row').filter({ hasText: /ST\d+-/ })).toHaveCount(2);

    // Change the first variant: set an exact number.
    await stockRow(page, first?.sku ?? '')
      .getByRole('link', { name: /^Change/ })
      .click();
    await expect(page.getByRole('heading', { name: 'Change stock', level: 1 })).toBeVisible();
    await expect(page.getByText('Available now: 0', { exact: true })).toBeVisible();
    await page.getByLabel('New number').fill('12');
    let sent = nextRequestBody(page, 'PUT', /^\/api\/vendors\/me\/inventory\/variants\/[^/]+$/);
    await page.getByRole('button', { name: 'Save stock' }).click();
    expect(await sent).toEqual({ quantity: 12 });
    await expect(toast(page, 'Stock saved. Available now: 12')).toBeVisible();
    await expect(page.getByText('Available now: 12', { exact: true })).toBeVisible();
    await expect(page.getByRole('main').getByText('In stock', { exact: true })).toBeVisible();
    await noAxeViolations(page);

    // Remove three, with a note.
    await page.getByRole('radio', { name: 'Remove' }).check();
    await page.getByLabel('Units to remove').fill('3');
    await page.getByLabel('Note').fill('Three damaged');
    sent = nextRequestBody(page, 'POST', /\/adjust$/);
    await page.getByRole('button', { name: 'Save stock' }).click();
    expect(await sent).toEqual({ delta: -3, note: 'Three damaged' });
    await expect(page.getByText('Available now: 9', { exact: true })).toBeVisible();

    // Removing more than there is: the backend refuses, and the number stays.
    await page.getByLabel('Units to remove').fill('50');
    await page.getByRole('button', { name: 'Save stock' }).click();
    await expect(
      page
        .getByText('The number must be from 0 to 1,000,000, and stock cannot go below 0.')
        .first(),
    ).toBeVisible();
    await expect(page.getByText('Available now: 9', { exact: true })).toBeVisible();

    // The threshold: low at or below 10 makes 9 low; empty goes back to the default.
    await page.getByLabel('Low at or below').fill('10');
    sent = nextRequestBody(page, 'PATCH', /^\/api\/vendors\/me\/inventory\/variants\/[^/]+$/);
    await page.getByRole('button', { name: 'Save threshold' }).click();
    expect(await sent).toEqual({ lowStockThreshold: 10 });
    await expect(page.getByText('Now low at or below 10.')).toBeVisible();
    await expect(page.getByRole('main').getByText('Low', { exact: true })).toBeVisible();
    await page.getByLabel('Low at or below').fill('');
    sent = nextRequestBody(page, 'PATCH', /^\/api\/vendors\/me\/inventory\/variants\/[^/]+$/);
    await page.getByRole('button', { name: 'Save threshold' }).click();
    expect(await sent).toEqual({ lowStockThreshold: null });
    await expect(page.getByText('Now low at or below 5 (the default).')).toBeVisible();

    // The history, newest first.
    await page.getByRole('link', { name: 'See history' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: /^History: Stock kurta/ }),
    ).toBeVisible();
    const historyRows = page.getByRole('row').filter({ has: page.getByRole('cell') });
    await expect(historyRows.nth(0)).toContainText('Removed 3');
    await expect(historyRows.nth(0)).toContainText('Three damaged');
    await expect(historyRows.nth(1)).toContainText('Set to 12');
    await noAxeViolations(page);

    // The second variant was not touched.
    await page.goto('/en/vendor/stock');
    await expect(stockRow(page, second?.sku ?? '')).toContainText('Out');
  });

  test('bulk update: rows checked before sending, all or nothing, then the stock returned', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Approved);
    await page.setViewportSize(WIDE);
    const { variants } = await draftWithTwoVariants(page, `Bulk kurta ${Date.now()}`);
    const [first, second] = variants;
    await page.goto('/en/vendor/stock');
    await page.getByRole('link', { name: 'Bulk update' }).click();
    await expect(page.getByRole('heading', { name: 'Bulk update by SKU', level: 1 })).toBeVisible();

    // Rows pasted from a spreadsheet fill the table.
    await page.getByLabel('SKU, row 1').focus();
    await page.evaluate((text) => {
      const data = new DataTransfer();
      data.setData('text', text);
      document.activeElement?.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
      );
    }, `${first?.sku}\t30\nNO-SUCH-SKU\t5\n${second?.sku}\tseven`);
    await expect(page.getByLabel('SKU, row 2')).toHaveValue('NO-SUCH-SKU');
    await expect(page.getByLabel('New number, row 3')).toHaveValue('seven');

    // A number that is not whole is caught here; nothing is sent.
    await page.getByRole('button', { name: 'Send update' }).click();
    await expect(page.getByText('Enter a whole number')).toBeVisible();
    await expect(
      page.getByText('Nothing was changed. 1 row has a problem.', { exact: false }),
    ).toBeVisible();

    // The backend refuses the unknown SKU; nothing changes.
    await page.getByLabel('New number, row 3').fill('7');
    const sent = nextRequestBody(page, 'POST', /^\/api\/vendors\/me\/inventory\/bulk$/);
    await page.getByRole('button', { name: 'Send update' }).click();
    expect(await sent).toEqual({
      items: [
        { sku: first?.sku, quantity: 30 },
        { sku: 'NO-SUCH-SKU', quantity: 5 },
        { sku: second?.sku, quantity: 7 },
      ],
    });
    await expect(page.getByText('SKU not found')).toBeVisible();
    await expect(page.getByLabel('SKU, row 2')).toHaveAttribute('aria-invalid', 'true');
    await noAxeViolations(page);
    const stock = (await backend(page, 'GET', '/vendors/me/inventory?q=ST')) as {
      items: { available: number }[];
    };
    expect(stock.items.every((row) => row.available === 0)).toBe(true);

    // Without the bad row, it goes through, and the stock returned is listed.
    await page.getByRole('button', { name: 'Remove row 2' }).click();
    await page.getByRole('button', { name: 'Send update' }).click();
    await expect(page.getByText('Stock updated. 2 variants changed.')).toBeVisible();
    const result = page.getByRole('region', { name: 'Stock after the update' });
    await expect(result.getByRole('row').filter({ hasText: first?.sku ?? '' })).toContainText('30');
    await expect(result.getByRole('row').filter({ hasText: second?.sku ?? '' })).toContainText('7');
  });

  test('a bulk update whose outcome is unknown is not sent again; the stock now is shown', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Approved);
    await page.setViewportSize(WIDE);
    const { variants } = await draftWithTwoVariants(page, `Unknown kurta ${Date.now()}`);
    await page.goto('/en/vendor/stock/bulk');
    await page.getByLabel('SKU, row 1').fill(variants[0]?.sku ?? '');
    await page.getByLabel('New number, row 1').fill('4');
    let sends = 0;
    await page.route('**/api/vendors/me/inventory/bulk', (route) => {
      sends += 1;
      return route.abort('connectionreset');
    });
    await page.getByRole('button', { name: 'Send update' }).click();
    await expect(
      page.getByText('We could not tell whether the update went through.', { exact: false }),
    ).toBeVisible();
    // The connection was cut before the backend, so the stock now is still 0.
    await expect(
      page.getByRole('listitem').filter({ has: page.getByLabel('SKU, row 1') }),
    ).toContainText('Now: 0');
    expect(sends).toBe(1);
  });

  test('a vendor that is not approved reads stock and changes nothing; a part that fails says so in place', async ({
    browser,
  }) => {
    // A suspended vendor that has a product.
    const made = await vendorIn(browser, MadeStatus.Approved);
    const { page } = made;
    await page.setViewportSize(WIDE);
    const { productId, variants } = await draftWithTwoVariants(page, `Paused kurta ${Date.now()}`);
    await backend(await admin(browser), 'POST', `/admin/vendors/${made.id}/suspend`, {
      reason: 'Test: paused.',
    });
    await page.goto('/en/vendor/stock');
    await expect(
      page.getByText('Your vendor account is suspended. You can read this page but not change it.'),
    ).toBeVisible();
    await expect(stockRow(page, variants[0]?.sku ?? '')).toBeVisible();
    await expect(page.getByRole('link', { name: /^Change/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Bulk update' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^History/ })).toHaveCount(2);
    // The variant's page shows it, without forms.
    await page.goto(`/en/vendor/stock/${productId}/${variants[0]?.id}`);
    await expect(page.getByText('Available now: 0', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save stock' })).toHaveCount(0);
    await noAxeViolations(page);

    // The summary fails on its own; the list still shows.
    await page.route('**/api/vendors/me/inventory/summary', (route) =>
      route.fulfill({ status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE' } } }),
    );
    await page.goto('/en/vendor/stock');
    await expect(page.getByText('We could not load the stock summary.')).toBeVisible();
    await expect(stockRow(page, variants[0]?.sku ?? '')).toBeVisible();
    await page.unroute('**/api/vendors/me/inventory/summary');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('region', { name: 'Stock summary' })).toBeVisible();

    // An unknown variant is a clear not-found state.
    await page.goto(`/en/vendor/stock/${productId}/01a1a131-0000-7000-8000-000000000000`);
    await expect(page.getByText('This variant was not found')).toBeVisible();

    // In Hindi.
    await page.goto('/hi/vendor/stock');
    await expect(page.getByRole('heading', { name: 'स्टॉक', level: 1 })).toBeVisible();
    await expect(page.getByRole('region', { name: 'स्टॉक का सारांश' })).toBeVisible();
    await noAxeViolations(page);
  });

  test('a vendor waiting for review with no products sees the empty list', async ({ browser }) => {
    const { page } = await vendorIn(browser, MadeStatus.Submitted);
    await page.goto('/en/vendor/stock');
    await expect(page.getByText('No variants yet')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Bulk update' })).toHaveCount(0);
  });
});
