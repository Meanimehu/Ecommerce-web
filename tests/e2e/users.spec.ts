import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog, freshPhone, pageAs } from './support/login';
import { countFirstLoad, expectWithinBudget } from './support/page-size';
import { admin } from './support/products';
import { nextRequestBody } from './support/requests';
import { StaffRole, staffWith } from './support/staff';

/**
 * Slice 5b (Document 5, section 8.3; Document 8, Slice 5 notes): Users and roles. An admin finds a
 * person by phone number, gives and removes a staff role, and blocks and unblocks the account; the
 * backend's refusals show on the page. Each test makes its own person. Against the real local
 * backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const NO_ACCESS = "You don't have access to this page";

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const toast = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });

/** The admin's page, on the users list filtered to one phone number. */
async function adminFinds(adminPage: Page, phone: string) {
  await adminPage.goto(`/en/admin/users?phone=${phone}`);
  const row = adminPage.getByRole('row').filter({ hasText: phone.slice(-4) });
  await expect(row).toHaveCount(1);
  return row;
}

test.describe('users and roles', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('an admin finds a person, gives the support role and removes it; the person gains and loses the Admin area', async ({
    browser,
  }) => {
    const phone = freshPhone();
    const person = await pageAs(browser, phone, '/en/account');
    const adminPage = await admin(browser);
    await adminPage.setViewportSize(WIDE);

    await adminPage.goto('/en/admin/users');
    await expect(
      adminPage.getByRole('heading', { name: 'Users and roles', level: 1 }),
    ).toBeVisible();
    await expect(
      adminPage.locator('aside').getByRole('link', { name: 'Users and roles' }),
    ).toHaveAttribute('aria-current', 'page');
    await adminPage.getByLabel('Phone number').fill(phone);
    await adminPage.getByRole('button', { name: 'Show results' }).click();
    await expect(adminPage).toHaveURL(new RegExp(`/en/admin/users\\?phone=${phone}$`));
    const row = adminPage.getByRole('row').filter({ hasText: phone.slice(-4) });
    await expect(row).toContainText('Customer');
    await expect(row).toContainText('Active');
    await noAxeViolations(adminPage);

    await row.getByRole('link').click();
    await expect(adminPage.getByRole('heading', { level: 1 })).toContainText(phone.slice(-4));
    const roles = adminPage.getByRole('region', { name: 'Roles' });
    await expect(roles.getByText('Every account has it')).toBeVisible();
    await noAxeViolations(adminPage);

    // Nothing is chosen at the start: "Add role" asks for a choice and sends nothing.
    await expect(roles.getByLabel('Role')).toHaveValue('');
    await roles.getByRole('button', { name: 'Add role' }).click();
    await expect(roles.getByText('Choose one.').first()).toBeVisible();
    // Give the support role: only the role is sent.
    await roles.getByLabel('Role').selectOption('support');
    const sent = nextRequestBody(adminPage, 'POST', /^\/api\/admin\/users\/[^/]+\/roles$/);
    await roles.getByRole('button', { name: 'Add role' }).click();
    expect(await sent).toEqual({ role: 'support' });
    await expect(toast(adminPage, 'Role added')).toBeVisible();
    await expect(roles.getByRole('button', { name: /^Remove\s*: Support$/ })).toBeVisible();
    await expect(roles.getByLabel('Role').locator('option')).not.toContainText(['Support']);

    // The person now reaches the Admin area.
    await person.goto('/en/admin');
    await expect(person.getByRole('heading', { name: 'Admin home', level: 1 })).toBeVisible();

    // Remove it, after the confirmation; the person loses the Admin area again.
    await roles.getByRole('button', { name: /^Remove\s*: Support$/ }).click();
    const confirm = adminPage.getByRole('alertdialog', { name: 'Remove the Support role?' });
    await confirm.getByRole('button', { name: 'Remove' }).click();
    await expect(toast(adminPage, 'Role removed')).toBeVisible();
    await expect(roles.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
    const answer = await person.goto('/en/admin');
    expect(answer?.status()).toBe(403);
    await expect(person.getByRole('heading', { name: NO_ACCESS })).toBeVisible();

    // The list's role filter finds people by role.
    await adminPage.goto(`/en/admin/users?role=moderator`);
    await expect(adminPage.getByRole('combobox', { name: 'Role' })).toHaveValue('moderator');
    await expect(adminPage.getByRole('cell', { name: /Moderator/ }).first()).toBeVisible();
  });

  test('an admin blocks a person with a reason, and unblocks them; blocking oneself is refused', async ({
    browser,
  }) => {
    const phone = freshPhone();
    const person = await pageAs(browser, phone, '/en/account');
    const adminPage = await admin(browser);
    await adminPage.setViewportSize(WIDE);
    const row = await adminFinds(adminPage, phone);
    await row.getByRole('link').click();
    const access = adminPage.getByRole('region', { name: 'Account access' });

    // A reason is needed before anything is sent.
    await access.getByRole('button', { name: 'Block' }).click();
    const dialog = adminPage.getByRole('alertdialog', { name: /^Block .*\?$/ });
    await dialog.getByRole('button', { name: 'Block user' }).click();
    await expect(dialog.getByText('Write a reason.').first()).toBeVisible();
    await dialog.getByLabel('Reason').fill('Test: fake orders.');
    const sent = nextRequestBody(adminPage, 'POST', /^\/api\/admin\/users\/[^/]+\/block$/);
    await dialog.getByRole('button', { name: 'Block user' }).click();
    expect(await sent).toEqual({ reason: 'Test: fake orders.' });
    await expect(toast(adminPage, 'User blocked')).toBeVisible();
    await expect(adminPage.getByText('Blocked', { exact: true })).toBeVisible();
    await expect(
      adminPage.getByRole('region', { name: 'Details' }).getByText('Test: fake orders.'),
    ).toBeVisible();

    // The person's session has ended: the next page sends them to log in.
    await person.goto('/en/account');
    await expect(person).toHaveURL(/\/en\/login/);

    await access.getByRole('button', { name: 'Unblock' }).click();
    await expect(toast(adminPage, 'User unblocked')).toBeVisible();
    await expect(adminPage.getByText('Active', { exact: true })).toBeVisible();

    // The admin cannot block their own account: the backend says so in the dialog.
    await adminPage.goto('/en/admin/users?phone=9000000001');
    await adminPage.getByRole('row').nth(1).getByRole('link').click();
    await adminPage
      .getByRole('region', { name: 'Account access' })
      .getByRole('button', { name: 'Block' })
      .click();
    const ownDialog = adminPage.getByRole('alertdialog');
    await ownDialog.getByLabel('Reason').fill('Test: should be refused.');
    await ownDialog.getByRole('button', { name: 'Block user' }).click();
    await expect(ownDialog.getByText('You cannot block your own account.').first()).toBeVisible();
    await noAxeViolations(adminPage);
  });

  test('only an admin opens it; in Hindi; within the page-size budget', async ({ browser }) => {
    const { page: moderator } = await staffWith(browser, [StaffRole.Moderator]);
    await expect(
      moderator.locator('aside').getByRole('link', { name: 'Users and roles' }),
    ).toHaveCount(0);
    const answer = await moderator.goto('/en/admin/users');
    expect(answer?.status()).toBe(403);

    const adminPage = await admin(browser);
    await adminPage.setViewportSize(WIDE);
    await adminPage.goto('/hi/admin/users?role=boss');
    await expect(
      adminPage.getByRole('heading', { name: 'उपयोगकर्ता और भूमिकाएँ', level: 1 }),
    ).toBeVisible();
    // An unknown role in the address is left out, not sent.
    await expect(adminPage.getByRole('combobox', { name: 'भूमिका' })).toHaveValue('');
    await expect(adminPage.getByRole('table')).toBeVisible();
    await noAxeViolations(adminPage);

    // Each language in a new browser context with the admin's cookies, so the cache is empty.
    const session = await adminPage.context().storageState();
    for (const lang of ['en', 'hi'] as const) {
      const context = await browser.newContext({
        storageState: session,
        ignoreHTTPSErrors: true,
        baseURL: test.info().project.use.baseURL,
      });
      const fresh = await context.newPage();
      const firstLoad = countFirstLoad(fresh, lang);
      await fresh.goto(`/${lang}/admin/users`, { waitUntil: 'networkidle' });
      expectWithinBudget(`/${lang}/admin/users`, lang, await firstLoad());
      await context.close();
    }
  });
});
