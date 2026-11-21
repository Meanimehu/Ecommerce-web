import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { admin } from './support/products';

/**
 * Slice 5g (Document 5, section 3; Document 6, section 10): when an Admin area screen built in
 * Slice 5 cannot read its own data, it says so in place with "Try again", the menu stays, and "Try
 * again" reads it again. The empty, view-only, no-access, wrong-filter and Hindi states are checked
 * in each screen's own spec.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const ANY_VARIANT = '00000000-0000-4000-8000-000000000000';

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

/** What the screen shows once "Try again" reads its data. */
enum After {
  Table = 'table',
  Anything = 'anything',
  /** No variant has the id in the address: the second read reaches the backend, which says so. */
  NotFound = 'not-found',
}

const SCREENS = [
  {
    path: '/en/admin/users',
    call: '/api/admin/users',
    heading: 'Users and roles',
    after: After.Table,
  },
  {
    path: '/en/admin/audit-log',
    call: '/api/admin/audit-log',
    heading: 'Audit log',
    after: After.Table,
  },
  {
    path: '/en/admin/moderation?queue=revision',
    call: '/api/moderation/products',
    heading: 'Product moderation',
    after: After.Anything,
  },
  {
    path: '/en/admin/catalogue/gst-rates',
    call: '/api/admin/catalogue/gst-rates',
    heading: 'Catalogue lists',
    after: After.Table,
  },
  { path: '/en/admin/sales', call: '/api/admin/sales', heading: 'Sales', after: After.Anything },
  {
    path: `/en/admin/inventory/variants/${ANY_VARIANT}`,
    call: `/api/admin/inventory/variants/${ANY_VARIANT}/history`,
    heading: 'Stock history',
    after: After.NotFound,
  },
];

/** A failed read, as the backend being away would give it. */
const UNAVAILABLE = { status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE' } } };

/** Whether a request is this screen's own read. */
const isRead = (url: string, method: string, call: string) =>
  method === 'GET' && new URL(url).pathname === call;

test.describe('Admin area states', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('a Slice 5 screen whose data cannot be read says so in place, and "Try again" reads it again', async ({
    browser,
  }) => {
    const page = await admin(browser);
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const screen of SCREENS) {
      const failRead = (route: Parameters<Parameters<Page['route']>[1]>[0]) =>
        isRead(route.request().url(), route.request().method(), screen.call)
          ? route.fulfill(UNAVAILABLE)
          : route.continue();
      await page.route(`**${screen.call}*`, failRead);
      await page.goto(screen.path);
      await expect(page.getByRole('heading', { name: screen.heading, level: 1 })).toBeVisible();
      const retry = page.getByRole('main').getByRole('button', { name: 'Try again' }).first();
      await expect(retry, screen.path).toBeVisible();
      await expect(page.locator('aside').getByRole('link', { name: 'Home' })).toBeVisible();
      await noAxeViolations(page);

      await page.unroute(`**${screen.call}*`, failRead);
      const read = page.waitForResponse((response) =>
        isRead(response.url(), response.request().method(), screen.call),
      );
      await retry.click();
      const answer = await read;
      if (screen.after === After.NotFound) {
        expect(answer.status(), screen.path).toBe(404);
        continue;
      }
      expect(answer.ok(), screen.path).toBe(true);
      await expect(retry).toBeHidden();
      if (screen.after === After.Table) await expect(page.getByRole('table')).toBeVisible();
    }
  });

  test('the same in Hindi', async ({ browser }) => {
    const page = await admin(browser);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.route('**/api/admin/audit-log*', (route) => route.fulfill(UNAVAILABLE));
    await page.goto('/hi/admin/audit-log');
    await expect(page.getByRole('heading', { name: 'ऑडिट लॉग', level: 1 })).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('button', { name: 'फिर से कोशिश करें' }).first(),
    ).toBeVisible();
    await noAxeViolations(page);
  });
});
