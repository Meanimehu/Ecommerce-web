import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { countFirstLoad, expectWithinBudget } from './support/page-size';
import { backend, draftWithTwoVariants } from './support/products';
import { StaffRole, staffWith } from './support/staff';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Slice 5f (Document 5, section 8.3; Document 8, Slice 5 notes): every vendor's sales for staff,
 * cancelling with a reason (admins and moderators), "View only" for the other roles, and any
 * variant's stock history, reached by links from Sales and Moderation only. Each test makes its
 * own vendor, product and sale. Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const HOUR_MS = 3_600_000;

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const toast = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });

/** A vendor with one product and an upcoming sale on its first variant (test set-up, through the backend). */
async function vendorWithSale(browser: Parameters<typeof vendorIn>[0]) {
  const { page } = await vendorIn(browser, MadeStatus.Approved);
  const { productId, variants } = await draftWithTwoVariants(
    page,
    `Staff sale kurta ${Date.now()}`,
  );
  const variantId = variants[0]?.id ?? '';
  await backend(page, 'POST', '/vendors/me/sales', {
    variantId,
    salePricePaise: 99900,
    startsAt: new Date(Date.now() + HOUR_MS).toISOString(),
    endsAt: new Date(Date.now() + 48 * HOUR_MS).toISOString(),
  });
  return { vendor: page, productId, variantId };
}

test.describe('staff sales and stock history', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('a moderator finds a sale, opens its stock history, and cancels it with a reason', async ({
    browser,
  }) => {
    const { vendor, productId, variantId } = await vendorWithSale(browser);
    const { page } = await staffWith(browser, [StaffRole.Moderator], '/en/admin/sales');
    await page.setViewportSize(WIDE);
    await expect(page.getByRole('heading', { name: 'Sales', level: 1 })).toBeVisible();
    await expect(page.locator('aside').getByRole('link', { name: 'Sales' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByText('View only', { exact: true })).toHaveCount(0);

    await page.getByLabel('Variant id').fill(variantId);
    await page.getByRole('button', { name: 'Show' }).click();
    await expect(page).toHaveURL(new RegExp(`/en/admin/sales\\?variantId=${variantId}$`));
    const row = page.getByRole('row').filter({ hasText: variantId });
    await expect(row).toContainText('₹999');
    await expect(row).toContainText('Upcoming');
    await noAxeViolations(page);

    // Its stock history, by the row's link.
    await row.getByRole('link', { name: 'Stock history' }).click();
    await expect(page).toHaveURL(new RegExp(`/en/admin/inventory/variants/${variantId}$`));
    await expect(page.getByRole('heading', { name: 'Stock history', level: 1 })).toBeVisible();
    await expect(page.getByText(`Variant ${variantId}`)).toBeVisible();
    await noAxeViolations(page);

    // The moderation review links each variant to its stock history too.
    await page.goto(`/en/admin/moderation/${productId}`);
    await expect(page.getByRole('link', { name: /^Stock history/ }).first()).toHaveAttribute(
      'href',
      /\/en\/admin\/inventory\/variants\//,
    );

    // Cancel: a reason is needed first.
    await page.goto(`/en/admin/sales?variantId=${variantId}`);
    await page
      .getByRole('row')
      .filter({ hasText: variantId })
      .getByRole('button', { name: /^Cancel sale/ })
      .click();
    const dialog = page.getByRole('alertdialog', { name: 'Cancel this sale?' });
    await dialog.getByRole('button', { name: 'Cancel sale' }).click();
    await expect(dialog.getByText('Write a reason.').first()).toBeVisible();
    await dialog.getByLabel(/^Reason/).fill('Test: the price was a mistake.');
    await dialog.getByRole('button', { name: 'Cancel sale' }).click();
    await expect(toast(page, 'Sale cancelled')).toBeVisible();
    const cancelled = page.getByRole('row').filter({ hasText: variantId });
    await expect(cancelled).toContainText('Cancelled');
    await expect(cancelled).toContainText('Test: the price was a mistake.');
    await expect(cancelled.getByRole('button')).toHaveCount(0);

    // The vendor sees it cancelled.
    await vendor.setViewportSize(WIDE);
    await vendor.goto('/en/vendor/sales');
    await expect(vendor.getByRole('row').filter({ hasText: '₹999' }).first()).toContainText(
      'Cancelled',
    );
  });

  test('support reads sales with "View only" and opens stock history; marketing reads sales only', async ({
    browser,
  }) => {
    const { variantId } = await vendorWithSale(browser);
    const { page: support } = await staffWith(
      browser,
      [StaffRole.Support],
      `/en/admin/sales?variantId=${variantId}`,
    );
    await support.setViewportSize(WIDE);
    await expect(support.getByText('View only', { exact: true })).toBeVisible();
    const row = support.getByRole('row').filter({ hasText: variantId });
    await expect(row).toContainText('Upcoming');
    await expect(support.getByRole('button', { name: /^Cancel sale/ })).toHaveCount(0);
    await noAxeViolations(support);
    await row.getByRole('link', { name: 'Stock history' }).click();
    await expect(support.getByRole('heading', { name: 'Stock history', level: 1 })).toBeVisible();

    const { page: marketing } = await staffWith(
      browser,
      [StaffRole.Marketing],
      `/en/admin/sales?variantId=${variantId}`,
    );
    await marketing.setViewportSize(WIDE);
    await expect(marketing.getByText('View only', { exact: true })).toBeVisible();
    await expect(marketing.getByRole('link', { name: 'Stock history' })).toHaveCount(0);
    const answer = await marketing.goto(`/en/admin/inventory/variants/${variantId}`);
    expect(answer?.status()).toBe(403);
  });

  test('an id with the wrong shape is marked; in Hindi; within the page-size budget', async ({
    browser,
  }) => {
    const { page } = await staffWith(browser, [StaffRole.Finance], '/en/admin/sales?vendorId=01a1');
    await page.setViewportSize(WIDE);
    await expect(page.getByText('Enter the full id.')).toBeVisible();
    await expect(page.getByText('Fix the marked filters to see the sales.')).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(0);

    await page.goto('/hi/admin/sales');
    await expect(page.getByRole('heading', { name: 'सेल', level: 1 })).toBeVisible();
    await expect(page.getByText('केवल देखें', { exact: true })).toBeVisible();
    await noAxeViolations(page);

    const session = await page.context().storageState();
    for (const lang of ['en', 'hi'] as const) {
      const context = await browser.newContext({
        storageState: session,
        ignoreHTTPSErrors: true,
        baseURL: test.info().project.use.baseURL,
      });
      const fresh = await context.newPage();
      const firstLoad = countFirstLoad(fresh, lang);
      await fresh.goto(`/${lang}/admin/sales`, { waitUntil: 'networkidle' });
      expectWithinBudget(`/${lang}/admin/sales`, lang, await firstLoad());
      await context.close();
    }
  });
});
