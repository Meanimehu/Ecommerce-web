import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { countFirstLoad, reportFirstLoad } from './support/page-size';
import { admin, backend } from './support/products';
import { nextRequestBody } from './support/requests';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Held item H3 (Document 5, section 8.2; area-5-sales-cart-coupons.md, part 3, vendor sections):
 * the coupons that charge a vendor. The vendor reads every term and the most it can pay; accepting
 * sends the fingerprint of the terms on screen, and terms changed meanwhile are refused, shown anew
 * and accepted only on a second press; a coupon is disabled, and a pending one declined; a vendor
 * that is not approved can decline but not accept. The coupons are made by the admin through the
 * backend, as set-up. Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const toast = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });
const uniqueCode = (prefix: string) => `${prefix}${String(Date.now()).slice(-8)}`;

type Made = { id: string; code: string; termsDigest: string };

/** A coupon the vendor pays for: ₹200 off, 50 uses, so at most ₹10,000. */
async function vendorCoupon(adminPage: Page, vendorId: string, prefix: string) {
  return (await backend(adminPage, 'POST', '/admin/coupons', {
    code: uniqueCode(prefix),
    discountType: 'fixed',
    value: 20000,
    usageLimit: 50,
    fundedBy: 'vendor',
    vendorId,
  })) as Made;
}

const card = (page: Page, code: string) => page.getByRole('region', { name: code });

test.describe('the coupons that charge a vendor', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('accepting the terms on screen; terms changed meanwhile are shown again first', async ({
    browser,
  }) => {
    const vendor = await vendorIn(browser, MadeStatus.Approved);
    const adminPage = await admin(browser);
    const coupon = await vendorCoupon(adminPage, vendor.id, 'VACC');
    const page = vendor.page;
    await page.setViewportSize(WIDE);

    await page.goto('/en/vendor');
    await page.locator('aside').getByRole('link', { name: 'Coupons' }).click();
    await expect(page.getByRole('heading', { name: 'Coupons', level: 1 })).toBeVisible();
    const mine = card(page, coupon.code);
    await expect(mine).toContainText('Waiting for the vendor');
    await expect(mine).toContainText('₹200 off');
    await expect(mine).toContainText('₹10,000');
    await noAxeViolations(page);

    // Dhaaga changes the terms while the vendor reads the old ones.
    await backend(adminPage, 'PATCH', `/admin/coupons/${coupon.id}`, { value: 30000 });
    await mine.getByRole('button', { name: /^Accept terms/ }).click();
    const dialog = page.getByRole('alertdialog', { name: `Accept the terms of ${coupon.code}?` });
    await expect(dialog).toContainText('at most ₹10,000');
    let sent = nextRequestBody(page, 'POST', /^\/api\/vendors\/me\/coupons\/[^/]+\/accept$/);
    await dialog.getByRole('button', { name: 'Accept terms' }).click();
    expect(await sent).toEqual({ termsDigest: coupon.termsDigest });
    await expect(mine.getByText(/These terms changed while you were looking/)).toBeVisible();
    await expect(mine).toContainText('₹300 off');
    await expect(mine).toContainText('Waiting for the vendor');

    // Accepting again sends the new terms' fingerprint.
    await mine.getByRole('button', { name: /^Accept terms/ }).click();
    await expect(dialog).toContainText('at most ₹15,000');
    sent = nextRequestBody(page, 'POST', /^\/api\/vendors\/me\/coupons\/[^/]+\/accept$/);
    await dialog.getByRole('button', { name: 'Accept terms' }).click();
    expect(await sent).not.toEqual({ termsDigest: coupon.termsDigest });
    await expect(toast(page, 'Terms accepted.')).toBeVisible();
    await page.reload();
    await expect(card(page, coupon.code)).toContainText('Active');
    await expect(card(page, coupon.code).getByRole('button', { name: /^Accept/ })).toHaveCount(0);
  });

  test('disabling an active coupon and declining a pending one', async ({ browser }) => {
    const vendor = await vendorIn(browser, MadeStatus.Approved);
    const adminPage = await admin(browser);
    const active = await vendorCoupon(adminPage, vendor.id, 'VOFF');
    await backend(vendor.page, 'POST', `/vendors/me/coupons/${active.id}/accept`, {
      termsDigest: active.termsDigest,
    });
    const pending = await vendorCoupon(adminPage, vendor.id, 'VDEC');
    const page = vendor.page;
    await page.setViewportSize(WIDE);
    await page.goto('/en/vendor/coupons');

    await card(page, active.code)
      .getByRole('button', { name: /^Disable/ })
      .click();
    await page
      .getByRole('alertdialog', { name: `Disable ${active.code}?` })
      .getByRole('button', { name: 'Disable' })
      .click();
    await expect(toast(page, 'Coupon stopped.')).toBeVisible();
    await expect(card(page, active.code)).toContainText('Disabled');

    await card(page, pending.code)
      .getByRole('button', { name: /^Decline/ })
      .click();
    await page
      .getByRole('alertdialog', { name: `Decline ${pending.code}?` })
      .getByRole('button', { name: 'Decline' })
      .click();
    await expect(card(page, pending.code)).toContainText('Disabled');

    // The status filter is kept in the address.
    await page.getByLabel('Status').selectOption('disabled');
    await page.getByRole('button', { name: 'Show' }).click();
    await expect(page).toHaveURL(/\/en\/vendor\/coupons\?status=disabled$/);
    await expect(page.getByRole('region')).toHaveCount(2);
  });

  test('a vendor that is not approved can decline but not accept; and in Hindi', async ({
    browser,
  }) => {
    const vendor = await vendorIn(browser, MadeStatus.Suspended);
    const adminPage = await admin(browser);
    const coupon = await vendorCoupon(adminPage, vendor.id, 'VSUS');
    const page = vendor.page;
    await page.goto('/en/vendor/coupons');
    const mine = card(page, coupon.code);
    await expect(mine).toContainText('Waiting for the vendor');
    await expect(mine.getByRole('button', { name: /^Accept/ })).toHaveCount(0);
    await expect(mine.getByRole('button', { name: /^Decline/ })).toBeVisible();

    await page.goto('/hi/vendor/coupons');
    await expect(page.getByRole('heading', { name: 'कूपन', level: 1 })).toBeVisible();
    await expect(card(page, coupon.code)).toContainText('वेंडर का इंतज़ार');
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
      await fresh.goto(`/${lang}/vendor/coupons`, { waitUntil: 'networkidle' });
      reportFirstLoad(`/${lang}/vendor/coupons`, await firstLoad());
      await context.close();
    }
  });
});
