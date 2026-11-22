import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Slice 4e and held item H7 (Document 5, section 3; Document 6, section 10): when a Vendor area
 * screen's own data cannot be read, it says so in place with "Try again", the menu and the banner
 * stay, and "Try again" reads it again. One vendor, every screen built in Slice 4, the products
 * list, and the held items' CSV import, coupons and coupon requests. The empty, read-only,
 * not-found and Hindi states are checked in each screen's own spec.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const SCREENS = [
  {
    path: '/en/vendor/profile',
    call: '**/api/vendors/me',
    heading: 'Business profile',
    after: 'Details',
  },
  {
    path: '/en/vendor/products',
    call: '**/api/vendors/me/products?*',
    heading: 'Products',
    after: 'No products yet',
  },
  {
    path: '/en/vendor/stock',
    call: '**/api/vendors/me/inventory?*',
    heading: 'Stock',
    after: 'No variants yet',
  },
  {
    path: '/en/vendor/sales',
    call: '**/api/vendors/me/sales?*',
    heading: 'Sales',
    after: 'No sales yet',
  },
  {
    path: '/en/vendor/imports',
    call: '**/api/vendors/me/imports?*',
    heading: 'Import products from a CSV file',
    after: 'No imports yet',
  },
  {
    path: '/en/vendor/coupons',
    call: '**/api/vendors/me/coupons?*',
    heading: 'Coupons',
    after: 'No coupons charge you yet',
  },
  {
    path: '/en/vendor/coupon-requests',
    call: '**/api/vendors/me/coupon-requests?*',
    heading: 'Coupons',
    after: 'No coupon requests yet',
  },
];

test.describe('Vendor area states', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('a screen whose data cannot be read says so in place, and "Try again" reads it again', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Approved);
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const screen of SCREENS) {
      await page.route(screen.call, (route) =>
        route.request().method() === 'GET'
          ? route.fulfill({ status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE' } } })
          : route.continue(),
      );
      await page.goto(screen.path);
      await expect(page.getByRole('heading', { name: screen.heading, level: 1 })).toBeVisible();
      const retry = page.getByRole('main').getByRole('button', { name: 'Try again' }).first();
      await expect(retry).toBeVisible();
      await expect(page.locator('aside').getByRole('link', { name: 'Home' })).toBeVisible();
      await noAxeViolations(page);
      await page.unroute(screen.call);
      await retry.click();
      await expect(page.getByText(screen.after, { exact: true }).first()).toBeVisible();
    }
  });

  test('the same in Hindi', async ({ browser }) => {
    const { page } = await vendorIn(browser, MadeStatus.Approved);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.route('**/api/vendors/me/sales?*', (route) =>
      route.fulfill({ status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE' } } }),
    );
    await page.goto('/hi/vendor/sales');
    await expect(page.getByRole('heading', { name: 'सेल', level: 1 })).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('button', { name: 'फिर से कोशिश करें' }),
    ).toBeVisible();
    await noAxeViolations(page);
  });
});
