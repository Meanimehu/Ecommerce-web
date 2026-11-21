import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog, freshPhone, pageAs } from './support/login';
import { countFirstLoad, expectWithinBudget } from './support/page-size';
import { admin, backend } from './support/products';
import { StaffRole, staffWith } from './support/staff';

/**
 * Slice 5c (Document 5, section 8.3; Document 8, Slice 5 notes): the audit log. An admin reads who
 * did what, filters it, and opens the changes of a row; a person's page links to their history.
 * Read only. Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

/** Today's date in IST, as a date box gives it. */
const istToday = () => new Date(Date.now() + (5 * 60 + 30) * 60_000).toISOString().slice(0, 10);

test.describe('the audit log', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('an admin finds a block in the log from the person’s page, with its reason and changes', async ({
    browser,
  }) => {
    const phone = freshPhone();
    await (await pageAs(browser, phone, '/en/account')).close();
    const adminPage = await admin(browser);
    await adminPage.setViewportSize(WIDE);
    const found = (await backend(adminPage, 'GET', `/admin/users?phone=${phone}`)) as {
      items: { id: string }[];
    };
    const id = found.items[0]?.id ?? '';
    await backend(adminPage, 'POST', `/admin/users/${id}/block`, { reason: 'Test: audit check.' });

    await adminPage.goto(`/en/admin/users/${id}`);
    await adminPage.getByRole('link', { name: 'Changes to this account' }).click();
    await expect(adminPage).toHaveURL(new RegExp(`/en/admin/audit-log\\?entityId=${id}$`));
    await expect(adminPage.getByRole('heading', { name: 'Audit log', level: 1 })).toBeVisible();
    await expect(
      adminPage.locator('aside').getByRole('link', { name: 'Audit log' }),
    ).toHaveAttribute('aria-current', 'page');
    const row = adminPage.getByRole('row').filter({ hasText: 'user.block' });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Test: audit check.');
    await expect(row).toContainText('Admin');
    await row.getByText('Show changes').click();
    await expect(row.getByText('Before: active')).toBeVisible();
    await expect(row.getByText('After: blocked')).toBeVisible();
    await noAxeViolations(adminPage);

    // Filters: the action and today's dates in IST keep the row; the address holds only those set.
    await adminPage.getByLabel('Action', { exact: true }).fill('user.block');
    await adminPage.getByLabel('From').fill(istToday());
    await adminPage.getByLabel('To').fill(istToday());
    await adminPage.getByRole('button', { name: 'Show results' }).click();
    await expect(adminPage).toHaveURL(
      new RegExp(`\\?action=user\\.block&entityId=${id}&from=${istToday()}&to=${istToday()}$`),
    );
    await expect(adminPage.getByRole('row').filter({ hasText: 'user.block' })).toHaveCount(1);

    // An id with the wrong shape is marked, and the log is not asked.
    await adminPage.goto('/en/admin/audit-log?actorId=01a1');
    await expect(adminPage.getByText('Enter the full id.')).toBeVisible();
    await expect(adminPage.getByText('Fix the marked filters to see the log.')).toBeVisible();
    await expect(adminPage.getByRole('table')).toHaveCount(0);
    await noAxeViolations(adminPage);
  });

  test('only an admin opens it; in Hindi; within the page-size budget', async ({ browser }) => {
    const { page: moderator } = await staffWith(browser, [StaffRole.Moderator]);
    await expect(moderator.locator('aside').getByRole('link', { name: 'Audit log' })).toHaveCount(
      0,
    );
    const answer = await moderator.goto('/en/admin/audit-log');
    expect(answer?.status()).toBe(403);

    const adminPage = await admin(browser);
    await adminPage.setViewportSize(WIDE);
    await adminPage.goto('/hi/admin/audit-log');
    await expect(adminPage.getByRole('heading', { name: 'ऑडिट लॉग', level: 1 })).toBeVisible();
    await expect(adminPage.getByRole('table')).toBeVisible();
    await noAxeViolations(adminPage);

    const session = await adminPage.context().storageState();
    for (const lang of ['en', 'hi'] as const) {
      const context = await browser.newContext({
        storageState: session,
        ignoreHTTPSErrors: true,
        baseURL: test.info().project.use.baseURL,
      });
      const fresh = await context.newPage();
      const firstLoad = countFirstLoad(fresh, lang);
      await fresh.goto(`/${lang}/admin/audit-log`, { waitUntil: 'networkidle' });
      expectWithinBudget(`/${lang}/admin/audit-log`, lang, await firstLoad());
      await context.close();
    }
  });
});
