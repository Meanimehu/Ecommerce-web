import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { countFirstLoad, reportFirstLoad } from './support/page-size';
import { admin, backend } from './support/products';
import { nextRequestBody } from './support/requests';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Held item H5 (Document 5, section 8.2; area-5-sales-cart-coupons.md, part 4): a vendor's coupon
 * requests. A new request is saved as a draft (checking what is sent), changed (only what changed),
 * sent for review; when Dhaaga asks for changes the vendor sees the note and sends it again; once
 * approved, the coupon waits on the other tab; a request can be withdrawn; a vendor that is not
 * approved makes none. Dhaaga's decisions are made through the backend here, as set-up; the staff's
 * screens have their own spec. Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const REQUEST_PATH = /\/en\/vendor\/coupon-requests\/[^/?]+$/;

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const toast = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });
const uniqueCode = (prefix: string) => `${prefix}${String(Date.now()).slice(-8)}`;
const term = (page: Page, label: string) =>
  page
    .locator('dt', { hasText: new RegExp(`^${label}$`) })
    .locator('xpath=following-sibling::dd[1]');

/** The request's id, from the page's address. */
const requestIdOf = (page: Page) => new URL(page.url()).pathname.split('/').at(-1) ?? '';

/** A new draft through the screen: ₹150 off, 200 uses, one per customer, the default dates. */
async function draftRequest(page: Page, code: string) {
  await page.goto('/en/vendor/coupon-requests/new');
  await page.getByLabel(/^Code you would like/).fill(code.toLowerCase());
  await page.getByLabel('Discount (₹)').fill('150');
  await page.getByLabel(/^Total uses/).fill('200');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page).toHaveURL(REQUEST_PATH);
}

test.describe('a vendor’s coupon requests', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('a draft, a change, sent for review, changes asked for, sent again, approved', async ({
    browser,
  }) => {
    const vendor = await vendorIn(browser, MadeStatus.Approved);
    const page = vendor.page;
    await page.setViewportSize(WIDE);

    // The second tab of Coupons; the menu still marks Coupons.
    await page.goto('/en/vendor/coupons');
    await page.getByRole('link', { name: 'Your coupon requests' }).click();
    await expect(page).toHaveURL(/\/en\/vendor\/coupon-requests$/);
    await expect(page.getByRole('link', { name: 'Your coupon requests' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('aside').getByRole('link', { name: 'Coupons' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByText('No coupon requests yet')).toBeVisible();
    await noAxeViolations(page);

    // A new request: the empty form says what is needed; a percentage needs a cap.
    await page.getByRole('link', { name: 'New request' }).click();
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByRole('link', { name: 'Fill this in.' }).first()).toBeVisible();
    await page.getByLabel('Kind of discount').selectOption('percent');
    await page.getByLabel('Discount (%)').fill('10');
    await page.getByLabel(/^Total uses/).fill('200');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByLabel(/^Most one order can save/)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await noAxeViolations(page);

    // Saved as a draft, with what was typed in the backend's units.
    await page.getByLabel('Kind of discount').selectOption('fixed');
    await page.getByLabel('Discount (₹)').fill('150');
    const code = uniqueCode('DIW');
    await page.getByLabel(/^Code you would like/).fill(code.toLowerCase());
    await page.getByLabel(/^Note for Dhaaga/).fill('Diwali weekend push');
    await page.getByLabel(/^Minimum of the eligible items/).fill('1000');
    const created = nextRequestBody(page, 'POST', /^\/api\/vendors\/me\/coupon-requests$/);
    await page.getByRole('button', { name: 'Save draft' }).click();
    expect(await created).toEqual({
      proposedCode: code,
      note: 'Diwali weekend push',
      discountType: 'fixed',
      value: 15000,
      minCartPaise: 100000,
      startsAt: expect.stringMatching(/Z$/),
      endsAt: expect.stringMatching(/Z$/),
      usageLimit: 200,
      perUserLimit: 1,
      excludeSaleItems: false,
      categoryIds: [],
      productIds: [],
    });
    await expect(toast(page, 'Request saved as a draft.')).toBeVisible();
    await expect(page).toHaveURL(REQUEST_PATH);
    await expect(page.getByRole('heading', { name: code, level: 1 })).toBeVisible();
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();
    await expect(term(page, 'Discount')).toHaveText('₹150 off');
    await expect(term(page, 'Most the vendor can pay')).toHaveText('₹30,000');
    const id = requestIdOf(page);

    // A change sends only what changed.
    await page.getByRole('link', { name: 'Change' }).click();
    await page.getByLabel('Discount (₹)').fill('120');
    const changed = nextRequestBody(page, 'PATCH', /^\/api\/vendors\/me\/coupon-requests\/[^/]+$/);
    await page.getByRole('button', { name: 'Save changes' }).click();
    expect(await changed).toEqual({ value: 12000 });
    await expect(toast(page, 'Request saved.')).toBeVisible();
    await expect(page).toHaveURL(REQUEST_PATH);
    await expect(term(page, 'Discount')).toHaveText('₹120 off');

    // Sent for review: it can no longer change, but can still be withdrawn.
    await page.getByRole('button', { name: 'Send for review' }).click();
    await expect(toast(page, 'Request sent for review.')).toBeVisible();
    await expect(page.getByText('In review', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Change' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Withdraw' })).toBeVisible();

    // Dhaaga asks for changes: the note shows, the history says so, and it is sent again.
    const adminPage = await admin(browser);
    await backend(adminPage, 'POST', `/admin/coupon-requests/${id}/request-changes`, {
      note: 'Please end it a day earlier.',
    });
    await page.reload();
    await expect(page.getByText('Changes asked for', { exact: true })).toBeVisible();
    await expect(page.getByText('Please end it a day earlier.').first()).toBeVisible();
    await expect(page.getByText('Dhaaga asked for changes')).toBeVisible();
    await page.getByRole('button', { name: 'Send for review' }).click();
    await expect(page.getByText('In review', { exact: true })).toBeVisible();
    await expect(page.getByText('Round 2').first()).toBeVisible();

    // Approved: the coupon made from it waits on the other tab.
    await backend(adminPage, 'POST', `/admin/coupon-requests/${id}/approve`, {});
    await page.reload();
    await expect(page.getByText('Waiting for you to accept', { exact: true })).toBeVisible();
    await expect(page.getByText(`Coupon ${code} was made from this request.`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Withdraw' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Accept it under Coupons that charge you' }).click();
    await expect(page.getByRole('region', { name: code })).toContainText('Waiting for the vendor');
    await noAxeViolations(page);
  });

  test('a draft is withdrawn for good, and the list filters by status', async ({ browser }) => {
    const vendor = await vendorIn(browser, MadeStatus.Approved);
    const page = vendor.page;
    const code = uniqueCode('WDR');
    await draftRequest(page, code);
    await page.getByRole('button', { name: 'Withdraw' }).click();
    await page
      .getByRole('alertdialog', { name: 'Withdraw this request?' })
      .getByRole('button', { name: 'Withdraw' })
      .click();
    await expect(toast(page, 'Request withdrawn.')).toBeVisible();
    await expect(page.getByText('Withdrawn', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send for review' })).toHaveCount(0);

    await page.goto('/en/vendor/coupon-requests');
    await page.getByLabel('Status').selectOption('withdrawn');
    await page.getByRole('button', { name: 'Show' }).click();
    await expect(page).toHaveURL(/\/en\/vendor\/coupon-requests\?status=withdrawn$/);
    await expect(page.getByRole('link', { name: code })).toBeVisible();
  });

  test('a vendor that is not approved makes no request; and in Hindi', async ({ browser }) => {
    const vendor = await vendorIn(browser, MadeStatus.Submitted);
    const page = vendor.page;
    await page.goto('/en/vendor/coupon-requests');
    await expect(page.getByText('No coupon requests yet')).toBeVisible();
    await expect(page.getByRole('link', { name: 'New request' })).toHaveCount(0);

    await page.goto('/hi/vendor/coupon-requests');
    await expect(page.getByRole('link', { name: 'आपके कूपन अनुरोध' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByText('अभी कोई कूपन अनुरोध नहीं')).toBeVisible();
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
      await fresh.goto(`/${lang}/vendor/coupon-requests`, { waitUntil: 'networkidle' });
      reportFirstLoad(`/${lang}/vendor/coupon-requests`, await firstLoad());
      await context.close();
    }
  });
});
