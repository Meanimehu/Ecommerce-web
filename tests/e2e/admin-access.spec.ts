import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { StaffRole, staffWith } from './support/staff';

/**
 * Slice 5a (Document 5, sections 4 and 8.3; Document 8, Slice 5 notes): one Admin area for every
 * staff role. Each person sees only the screens their roles allow, in the menu and on the Admin
 * home; any other admin screen answers with a real 403 page. Against the real local backend;
 * skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const NO_SCREENS = 'You do not have access to any admin screen';
const NO_ACCESS = "You don't have access to this page";
const SCREENS = ['/en/admin/vendors', '/en/admin/catalogue/categories', '/en/admin/moderation'];

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const sideMenu = (page: Page) =>
  page.locator('aside').getByRole('navigation', { name: 'Menu' }).getByRole('link');

/** Opens an admin screen and expects the real 403 page. */
async function expectNoAccess(page: Page, path: string) {
  const answer = await page.goto(path);
  expect(answer?.status(), path).toBe(403);
  await expect(page.getByRole('heading', { name: NO_ACCESS })).toBeVisible();
}

test.describe('the Admin area for each staff role', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  for (const role of [StaffRole.Support, StaffRole.Marketing, StaffRole.Finance]) {
    test(`${role}: the Admin home says there is no screen yet, and every built screen answers 403`, async ({
      browser,
    }) => {
      const { page } = await staffWith(browser, [role]);
      await page.setViewportSize(WIDE);
      await expect(page.getByRole('heading', { name: 'Admin home', level: 1 })).toBeVisible();
      await expect(page.getByRole('heading', { name: NO_SCREENS })).toBeVisible();
      await expect(sideMenu(page)).toHaveText(['Home']);
      await noAxeViolations(page);
      for (const path of SCREENS) await expectNoAccess(page, path);
    });
  }

  test('a moderator opens moderation, and vendor review and the catalogue lists answer 403', async ({
    browser,
  }) => {
    const { page } = await staffWith(browser, [StaffRole.Moderator], '/en/admin/moderation');
    await page.setViewportSize(WIDE);
    await expect(page.getByRole('heading', { name: 'Product moderation', level: 1 })).toBeVisible();
    await expectNoAccess(page, '/en/admin/vendors');
    await expectNoAccess(page, '/en/admin/catalogue/categories');
    await noAxeViolations(page);
  });

  test('a person with two roles sees what either allows', async ({ browser }) => {
    const { page } = await staffWith(browser, [StaffRole.Support, StaffRole.Moderator]);
    await page.setViewportSize(WIDE);
    await expect(sideMenu(page)).toHaveText(['Home', 'Product moderation']);
    await expect(page.getByRole('main').getByRole('link')).toHaveText(['Product moderation']);
  });

  test('a customer opening the Admin area gets the 403 page', async ({ browser }) => {
    const { page } = await staffWith(browser, [], '/en/account');
    await expectNoAccess(page, '/en/admin');
  });

  test('in Hindi: the no-screen state and the 403 page', async ({ browser }) => {
    const { page } = await staffWith(browser, [StaffRole.Finance], '/hi/admin');
    await page.setViewportSize(WIDE);
    await expect(page.getByRole('heading', { name: 'एडमिन होम', level: 1 })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'आपके पास किसी एडमिन स्क्रीन की अनुमति नहीं है' }),
    ).toBeVisible();
    await noAxeViolations(page);
    const answer = await page.goto('/hi/admin/vendors');
    expect(answer?.status()).toBe(403);
    await expect(
      page.getByRole('heading', { name: 'आपके पास इस पेज की अनुमति नहीं है' }),
    ).toBeVisible();
  });
});
