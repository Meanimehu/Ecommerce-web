import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { countFirstLoad, reportFirstLoad } from './support/page-size';
import { admin, backend } from './support/products';
import { nextRequestBody } from './support/requests';
import { StaffRole, staffWith } from './support/staff';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Held item H6 (Document 5, section 8.3; area-5-sales-cart-coupons.md, part 4): the staff's review
 * of coupon requests. Admin and marketing ask for changes (with a note), approve (with the final
 * code; a code already used goes under it), or reject; nobody decides a request they made; finance
 * and support read with "View only". The vendor's side is made through the backend here, as set-up;
 * it has its own spec. Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const HOUR_MS = 3_600_000;

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const toast = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });
const uniqueCode = (prefix: string) => `${prefix}${String(Date.now()).slice(-8)}`;

/** A vendor's request, sent for review through the backend: ₹150 off, 200 uses, for a week. */
async function submittedRequest(vendorPage: Page, code: string) {
  const start = Date.now() + HOUR_MS;
  const made = (await backend(vendorPage, 'POST', '/vendors/me/coupon-requests', {
    proposedCode: code,
    note: 'Diwali weekend push',
    discountType: 'fixed',
    value: 15000,
    startsAt: new Date(start).toISOString(),
    endsAt: new Date(start + 7 * 24 * HOUR_MS).toISOString(),
    usageLimit: 200,
    perUserLimit: 1,
  })) as { id: string };
  await backend(vendorPage, 'POST', `/vendors/me/coupon-requests/${made.id}/submit`);
  return made.id;
}

test.describe('the staff’s review of coupon requests', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('ask for changes, then approve with the final code', async ({ browser }) => {
    const vendor = await vendorIn(browser, MadeStatus.Approved);
    const code = uniqueCode('REQ');
    const id = await submittedRequest(vendor.page, code);
    const page = await admin(browser);
    await page.setViewportSize(WIDE);

    await page.goto('/en/admin');
    await page.locator('aside').getByRole('link', { name: 'Coupon requests' }).click();
    await expect(page.getByRole('heading', { name: 'Coupon requests', level: 1 })).toBeVisible();
    await page.getByLabel('Status').selectOption('submitted');
    await page.getByLabel('Vendor id').fill(vendor.id);
    await page.getByRole('button', { name: 'Show' }).click();
    await expect(page).toHaveURL(/\?status=submitted&vendorId=/);
    await page.getByRole('link', { name: code }).click();
    await expect(page.getByRole('heading', { name: code, level: 1 })).toBeVisible();
    await expect(page.getByText('Waiting for review', { exact: true })).toBeVisible();
    await expect(page.getByText('Diwali weekend push')).toBeVisible();
    await expect(page.getByText('The vendor sent it for review')).toBeVisible();
    await noAxeViolations(page);

    // Ask for changes, with a note the vendor reads.
    await page.getByRole('button', { name: 'Ask for changes' }).click();
    const changes = page.getByRole('alertdialog', { name: 'Ask the vendor for changes?' });
    await changes.getByRole('button', { name: 'Ask for changes' }).click();
    await expect(changes.getByText('Write a reason.').first()).toBeVisible();
    await changes.getByLabel(/^What to change/).fill('Please end it a day earlier.');
    let sent = nextRequestBody(page, 'POST', /\/request-changes$/);
    await changes.getByRole('button', { name: 'Ask for changes' }).click();
    expect(await sent).toEqual({ note: 'Please end it a day earlier.' });
    await expect(toast(page, 'Changes asked for.')).toBeVisible();
    await expect(page.getByText('Changes asked for', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Decision' })).toHaveCount(0);

    // The vendor sends it again; a code already used goes under the code.
    await backend(vendor.page, 'POST', `/vendors/me/coupon-requests/${id}/submit`);
    const taken = (await backend(page, 'POST', '/admin/coupons', {
      code: uniqueCode('TAKEN'),
      discountType: 'percent',
      value: 500,
      fundedBy: 'marketplace',
    })) as { code: string };
    await page.reload();
    await expect(page.getByText('Round 2').first()).toBeVisible();
    await page.getByRole('button', { name: 'Approve' }).click();
    const approve = page.getByRole('alertdialog', { name: 'Approve this request?' });
    await approve.getByLabel(/^Final code/).fill(taken.code);
    await approve.getByRole('button', { name: 'Approve' }).click();
    await expect(
      approve.getByRole('link', { name: 'Another coupon already uses this code.' }),
    ).toBeVisible();

    // Approved with the vendor's own code: the coupon waits for the vendor.
    await approve.getByLabel(/^Final code/).fill('');
    await approve.getByLabel(/^Note for the vendor/).fill('Approved for Diwali.');
    sent = nextRequestBody(page, 'POST', /\/approve$/);
    await approve.getByRole('button', { name: 'Approve' }).click();
    expect(await sent).toEqual({ note: 'Approved for Diwali.' });
    await expect(toast(page, 'Request approved. The coupon waits for the vendor.')).toBeVisible();
    await expect(page.getByText('Approved, waiting for the vendor', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: `Open coupon ${code}` }).click();
    await expect(page.getByRole('heading', { name: code, level: 1 })).toBeVisible();
    await expect(page.getByText('Waiting for the vendor', { exact: true })).toBeVisible();
  });

  test('reject with a note; finance reads with "View only"', async ({ browser }) => {
    const vendor = await vendorIn(browser, MadeStatus.Approved);
    const code = uniqueCode('REJ');
    const id = await submittedRequest(vendor.page, code);

    const finance = await staffWith(
      browser,
      [StaffRole.Finance],
      `/en/admin/coupon-requests/${id}`,
    );
    await expect(finance.page.getByRole('heading', { name: code, level: 1 })).toBeVisible();
    await expect(finance.page.getByText('View only')).toBeVisible();
    await expect(finance.page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await noAxeViolations(finance.page);

    const page = await admin(browser);
    await page.goto(`/en/admin/coupon-requests/${id}`);
    await page.getByRole('button', { name: 'Reject' }).click();
    const reject = page.getByRole('alertdialog', { name: 'Reject this request?' });
    await reject.getByLabel(/^Why/).fill('The discount is too high for this season.');
    await reject.getByRole('button', { name: 'Reject' }).click();
    await expect(toast(page, 'Request rejected.')).toBeVisible();
    await expect(page.getByText('Rejected', { exact: true })).toBeVisible();
    await expect(page.getByText('The discount is too high for this season.').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
  });

  test('nobody decides a request they made; and in Hindi', async ({ browser }) => {
    // A vendor owner who is also on the marketing staff.
    const vendor = await vendorIn(browser, MadeStatus.Approved);
    const code = uniqueCode('OWN');
    const id = await submittedRequest(vendor.page, code);
    const adminPage = await admin(browser);
    const found = (await backend(adminPage, 'GET', `/admin/users?phone=${vendor.phone}`)) as {
      items: { id: string }[];
    };
    await backend(adminPage, 'POST', `/admin/users/${found.items[0]?.id}/roles`, {
      role: StaffRole.Marketing,
    });
    const page = vendor.page;
    await page.goto(`/en/admin/coupon-requests/${id}`);
    await expect(
      page.getByText('You made this request, so someone else decides it.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);

    await page.goto('/hi/admin/coupon-requests');
    await expect(page.getByRole('heading', { name: 'कूपन अनुरोध', level: 1 })).toBeVisible();
    await noAxeViolations(page);

    const session = await adminPage.context().storageState();
    for (const lang of ['en', 'hi'] as const) {
      const context = await browser.newContext({
        storageState: session,
        ignoreHTTPSErrors: true,
        baseURL: test.info().project.use.baseURL,
      });
      const fresh = await context.newPage();
      const firstLoad = countFirstLoad(fresh, lang);
      await fresh.goto(`/${lang}/admin/coupon-requests`, { waitUntil: 'networkidle' });
      reportFirstLoad(`/${lang}/admin/coupon-requests`, await firstLoad());
      await context.close();
    }
  });
});
