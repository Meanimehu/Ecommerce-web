import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { backend, draftWithTwoVariants, setStock, staff, submitDraft } from './support/products';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Slice 4e (Document 5, section 7.2; approved Stage 5 Vendor home): the application's status, and
 * what needs attention: products waiting for review, rejected products, variants low on stock and
 * out of stock, each a link to its filtered list and each loading or failing on its own. Against
 * the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const attention = (page: Page) => page.getByRole('region', { name: 'Needs your attention' });
const tile = (page: Page, label: string) =>
  attention(page).getByRole('link', { name: new RegExp(`${label}$`) });

test.describe('vendor home', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('an approved vendor: the application, and the counts that need attention, each a link', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Approved);
    await page.setViewportSize(WIDE);
    const stamp = Date.now();
    const waiting = await draftWithTwoVariants(page, `Waiting kurta ${stamp}`);
    const rejected = await draftWithTwoVariants(page, `Rejected kurta ${stamp}`);
    await submitDraft(page, waiting.productId);
    await submitDraft(page, rejected.productId);
    const { moderator } = await staff(browser);
    const review = (await backend(
      moderator,
      'GET',
      `/moderation/products/${rejected.productId}`,
    )) as {
      seenUpdatedAt: string;
    };
    await backend(moderator, 'POST', `/moderation/products/${rejected.productId}/reject`, {
      seenUpdatedAt: review.seenUpdatedAt,
      reason: 'Test: the photo is not clear.',
    });
    // Four variants at 0; one set to 3, which is low (the default threshold is 5).
    await setStock(page, waiting.variants[0]?.id ?? '', 3);

    await page.goto('/en/vendor');
    await expect(page.getByRole('heading', { name: 'Vendor home', level: 1 })).toBeVisible();
    const application = page.getByRole('region', { name: 'Application status' });
    await expect(application.getByText('Approved', { exact: true })).toBeVisible();
    await expect(application.getByRole('link')).toHaveCount(0);
    await expect(tile(page, 'Waiting for review')).toHaveText(/^1\s*Waiting for review$/);
    await expect(tile(page, 'Rejected products')).toHaveText(/^1\s*Rejected products$/);
    await expect(tile(page, 'Low stock')).toHaveText(/^1\s*Low stock$/);
    await expect(tile(page, 'Out of stock')).toHaveText(/^3\s*Out of stock$/);
    await noAxeViolations(page);

    await tile(page, 'Rejected products').click();
    await expect(page).toHaveURL(/\/en\/vendor\/products\?status=rejected$/);
    await expect(page.getByRole('link', { name: `Rejected kurta ${stamp}` })).toBeVisible();
    await page.goto('/en/vendor');
    await tile(page, 'Low stock').click();
    await expect(page).toHaveURL(/\/en\/vendor\/stock\?status=low$/);

    // In Hindi.
    await page.goto('/hi/vendor');
    await expect(page.getByRole('region', { name: 'आपके ध्यान के लिए' })).toBeVisible();
    await noAxeViolations(page);
  });

  test('a vendor waiting for review is shown the way to the application; a part that fails says so in place', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Submitted);
    await page.setViewportSize(WIDE);
    await page.goto('/en/vendor');
    const application = page.getByRole('region', { name: 'Application status' });
    await expect(application.getByText('Waiting for review', { exact: true })).toBeVisible();
    await expect(application.getByRole('link', { name: 'Open your application' })).toHaveAttribute(
      'href',
      '/en/vendor/apply',
    );
    await expect(tile(page, 'Out of stock')).toHaveText(/^0\s*Out of stock$/);

    await page.route('**/api/vendors/me/inventory/summary', (route) =>
      route.fulfill({ status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE' } } }),
    );
    await page.reload();
    await expect(page.getByText('We could not load the stock summary.')).toBeVisible();
    await expect(tile(page, 'Waiting for review')).toBeVisible();
    await page.unroute('**/api/vendors/me/inventory/summary');
    await attention(page).getByRole('button', { name: 'Try again' }).click();
    await expect(tile(page, 'Low stock')).toBeVisible();
    await noAxeViolations(page);
  });
});
