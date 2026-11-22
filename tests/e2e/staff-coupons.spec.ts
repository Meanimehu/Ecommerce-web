import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { countFirstLoad, reportFirstLoad } from './support/page-size';
import { admin, backend } from './support/products';
import { nextRequestBody } from './support/requests';
import { StaffRole, staffWith } from './support/staff';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Held item H2 (Document 5, section 8.3; area-5-sales-cart-coupons.md, part 3): the staff's
 * coupons. Admin and marketing create one (checking what is sent), change only what changed,
 * disable it with a reason and enable it; a coupon the vendor pays for waits for the vendor; a code
 * already used goes under its field; finance and support read with "View only"; a moderator has no
 * coupon screen. Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const NO_ACCESS = "You don't have access to this page";

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const toast = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });
const uniqueCode = (prefix: string) => `${prefix}${String(Date.now()).slice(-8)}`;

/** A term's value on a coupon's page, by its label. */
const term = (page: Page, label: string) =>
  page
    .locator('dt', { hasText: new RegExp(`^${label}$`) })
    .locator('xpath=following-sibling::dd[1]');

test.describe('the staff’s coupons', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('an admin creates a coupon, changes one term, disables and enables it', async ({
    browser,
  }) => {
    const page = await admin(browser);
    await page.setViewportSize(WIDE);
    await page.goto('/en/admin');
    await page.locator('aside').getByRole('link', { name: 'Coupons' }).click();
    await expect(page.getByRole('heading', { name: 'Coupons', level: 1 })).toBeVisible();
    await noAxeViolations(page);

    // A new coupon: what is typed is sent in the backend's units, and nothing else.
    await page.getByRole('link', { name: 'New coupon' }).click();
    await expect(page.getByRole('heading', { name: 'New coupon', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Create coupon' }).click();
    await expect(page.getByRole('link', { name: 'Enter 3 to 20 letters' })).toBeVisible();
    const code = uniqueCode('FEST');
    await page.getByLabel('Code').fill(code.toLowerCase());
    await page.getByLabel('Discount (%)').fill('10');
    await page.getByLabel(/^Most one order can save/).fill('500');
    await page.getByLabel(/^Minimum of the eligible items/).fill('1000');
    await page.getByLabel(/^Total uses/).fill('100');
    await page.getByLabel('Leave out items on a vendor sale').check();
    await noAxeViolations(page);
    const created = nextRequestBody(page, 'POST', /^\/api\/admin\/coupons$/);
    await page.getByRole('button', { name: 'Create coupon' }).click();
    expect(await created).toEqual({
      code,
      discountType: 'percent',
      value: 1000,
      fundedBy: 'marketplace',
      maxDiscountPaise: 50000,
      minCartPaise: 100000,
      usageLimit: 100,
      excludeSaleItems: true,
      categoryIds: [],
      productIds: [],
    });
    await expect(toast(page, 'Coupon created.')).toBeVisible();
    await expect(page.getByRole('heading', { name: code, level: 1 })).toBeVisible();
    await expect(page.getByText('Active', { exact: true })).toBeVisible();
    await expect(term(page, 'Discount')).toHaveText('10% off, at most ₹500');
    await expect(term(page, 'Total uses')).toHaveText('100');
    await expect(term(page, 'Items on a vendor sale')).toHaveText('Left out');
    await noAxeViolations(page);

    // A change sends only the changed term; the code cannot change.
    await page.getByRole('link', { name: 'Change terms' }).click();
    await expect(page.getByLabel('Code')).toHaveAttribute('readonly', '');
    await page.getByLabel(/^Total uses/).fill('200');
    const changed = nextRequestBody(page, 'PATCH', /^\/api\/admin\/coupons\/[^/]+$/);
    await page.getByRole('button', { name: 'Save changes' }).click();
    expect(await changed).toEqual({ usageLimit: 200 });
    await expect(toast(page, 'Coupon saved.')).toBeVisible();
    await expect(page).toHaveURL(/\/en\/admin\/coupons\/[^/]+$/);
    await page.reload();
    await expect(term(page, 'Total uses')).toHaveText('200');

    // Disable with a reason; enable again.
    await page.getByRole('button', { name: new RegExp(`^Disable.*${code}$`) }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Disable this coupon?' });
    await dialog.getByRole('button', { name: 'Disable' }).click();
    await expect(dialog.getByText('Write a reason.').first()).toBeVisible();
    await dialog.getByLabel(/^Reason/).fill('Test: paused for review.');
    const disabled = nextRequestBody(page, 'POST', /^\/api\/admin\/coupons\/[^/]+\/disable$/);
    await dialog.getByRole('button', { name: 'Disable' }).click();
    expect(await disabled).toEqual({ reason: 'Test: paused for review.' });
    await expect(toast(page, 'Coupon disabled.')).toBeVisible();
    await expect(page.getByText('Disabled', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Enable' }).click();
    await expect(toast(page, 'Coupon enabled.')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Active', { exact: true })).toBeVisible();

    // The list finds it by its code, kept in the address.
    await page.goto('/en/admin/coupons');
    await page.getByLabel('Code').fill(code.toLowerCase());
    await page.getByRole('button', { name: 'Show' }).click();
    await expect(page).toHaveURL(new RegExp(`/en/admin/coupons\\?code=${code.toLowerCase()}$`));
    await expect(page.getByRole('row').filter({ hasText: code })).toContainText('10% off');
  });

  test('a coupon the vendor pays for waits for that vendor; a used code goes under its field', async ({
    browser,
  }) => {
    const vendor = await vendorIn(browser, MadeStatus.Approved);
    const page = await admin(browser);
    await page.setViewportSize(WIDE);
    await page.goto('/en/admin/coupons/new');
    const code = uniqueCode('VEND');
    await page.getByLabel('Code').fill(code);
    await page.getByLabel('Kind of discount').selectOption('fixed');
    await page.getByLabel('Discount (₹)').fill('200');
    await page.getByLabel(/^Total uses/).fill('50');
    await page.getByLabel('Who pays').selectOption('vendor');
    await page.getByRole('button', { name: 'Create coupon' }).click();
    await expect(page.getByRole('link', { name: /Enter a full id/ })).toBeVisible();
    await page.getByLabel(/^Vendor id/).fill(vendor.id);
    await page.getByRole('button', { name: 'Create coupon' }).click();
    await expect(page.getByRole('heading', { name: code, level: 1 })).toBeVisible();
    await expect(page.getByText('Waiting for the vendor', { exact: true })).toBeVisible();
    await expect(term(page, 'Most the vendor can pay')).toHaveText('₹10,000');
    await expect(term(page, 'Vendor accepted')).toHaveText('Not yet');

    // The same code again: the backend's answer goes under the code.
    await page.goto('/en/admin/coupons/new');
    await page.getByLabel('Code').fill(code);
    await page.getByLabel('Discount (%)').fill('5');
    await page.getByRole('button', { name: 'Create coupon' }).click();
    await expect(
      page.getByRole('link', { name: 'Another coupon already uses this code.' }),
    ).toBeVisible();
  });

  test('finance reads with "View only"; marketing may add; a moderator has no coupon screen', async ({
    browser,
  }) => {
    const adminPage = await admin(browser);
    const coupon = (await backend(adminPage, 'POST', '/admin/coupons', {
      code: uniqueCode('READ'),
      discountType: 'percent',
      value: 500,
      fundedBy: 'marketplace',
    })) as { id: string; code: string };

    const finance = await staffWith(browser, [StaffRole.Finance], '/en/admin/coupons');
    await expect(finance.page.getByText('View only')).toBeVisible();
    await expect(finance.page.getByRole('link', { name: 'New coupon' })).toHaveCount(0);
    await finance.page.goto(`/en/admin/coupons/${coupon.id}`);
    await expect(finance.page.getByRole('heading', { name: coupon.code, level: 1 })).toBeVisible();
    await expect(finance.page.getByText('View only')).toBeVisible();
    await expect(finance.page.getByRole('link', { name: 'Change terms' })).toHaveCount(0);
    await expect(finance.page.getByRole('button', { name: /^Disable/ })).toHaveCount(0);
    await noAxeViolations(finance.page);
    const refused = await finance.page.goto('/en/admin/coupons/new');
    expect(refused?.status()).toBe(403);
    await expect(finance.page.getByRole('heading', { name: NO_ACCESS })).toBeVisible();

    const marketing = await staffWith(browser, [StaffRole.Marketing], '/en/admin/coupons');
    await expect(marketing.page.getByRole('link', { name: 'New coupon' })).toBeVisible();

    const moderator = await staffWith(browser, [StaffRole.Moderator], '/en/admin');
    const answer = await moderator.page.goto('/en/admin/coupons');
    expect(answer?.status()).toBe(403);
  });

  test('in Hindi, and the page size (staff pages are reported, not limited)', async ({
    browser,
  }) => {
    const page = await admin(browser);
    await page.setViewportSize(WIDE);
    await page.goto('/hi/admin/coupons');
    await expect(page.getByRole('heading', { name: 'कूपन', level: 1 })).toBeVisible();
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
      await fresh.goto(`/${lang}/admin/coupons`, { waitUntil: 'networkidle' });
      reportFirstLoad(`/${lang}/admin/coupons`, await firstLoad());
      await context.close();
    }
  });
});
