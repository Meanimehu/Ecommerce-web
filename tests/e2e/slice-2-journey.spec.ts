import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { addAndSubmitProduct, applyAsVendor, approveProduct, approveVendor, KURTA_PHOTO } from './support/flows';
import { backendLog, freshPhone, logIn, pageAs } from './support/login';

/**
 * Slice 2 "done when" (Document 8): with test data, a vendor applies, an admin approves, the vendor adds and submits a
 * product, a moderator approves it, and a customer finds it, logs in, adds it and sees it in the cart.
 * New products start with 0 stock and stock screens come in Slice 4, so this test sets the quantity by calling the
 * backend directly (Document 8, Slice 2 notes). Against the real local backend; skipped where it is not running.
 */
const ADMIN_PHONE = process.env.E2E_ADMIN_PHONE ?? '9000000001';
const MODERATOR_PHONE = process.env.E2E_MODERATOR_PHONE ?? '9000000002';
const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:3000';
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

/** Test set-up only: the vendor's quantity for a variant, set at the backend (no screen does this before Slice 4). */
async function setStock(vendor: Page, productId: string, quantity: number) {
  const product = (await (await vendor.request.get(`/api/vendors/me/products/${productId}`)).json()) as { variants: { id: string }[] };
  const token = (await vendor.context().cookies()).find((c) => c.name === '__Host-dhaaga_at')?.value;
  const variant = product.variants[0]?.id ?? '';
  const answer = await fetch(`${BACKEND_URL}/api/v1/vendors/me/inventory/variants/${variant}`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  expect(answer.status).toBe(200);
}

test.describe('Slice 2: the first path, end to end', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(240_000);

  test('a vendor applies and is approved, adds a product that is approved, and a customer finds it, logs in, adds it and sees it in the cart', async ({ browser }) => {
    const vendorPhone = freshPhone();
    const n = vendorPhone.slice(-5);
    const shop = `Journey Weaves ${n}`;
    const title = `Journey block print kurta ${n}`;

    // Vendor applies; admin approves.
    const vendor = await pageAs(browser, vendorPhone, '/en/vendor/apply');
    await applyAsVendor(vendor, shop, vendorPhone);
    const admin = await pageAs(browser, ADMIN_PHONE, '/en/admin/vendors');
    await approveVendor(admin, shop);

    // The vendor adds a product and submits it; the moderator approves it.
    const address = await addAndSubmitProduct(vendor, title, `JRN${n}-M`);
    const productId = address.split('/').pop() as string;
    const moderator = await pageAs(browser, MODERATOR_PHONE, '/en/admin/moderation');
    await approveProduct(moderator, productId);
    await setStock(vendor, productId, 5);

    // A customer, not logged in, finds it in its category.
    const customer = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: test.info().project.use.baseURL, viewport: test.info().project.use.viewport });
    const page = await customer.newPage();
    // Photos load straight from the public photo host (D3-04). Locally that host is not running (Document 8, Slice 2
    // notes), so the test answers for it with a fixture: the addresses are real, only the bytes are stood in.
    const photoRequests: string[] = [];
    await page.route(/\/product-images\/.+\.webp$/, (route) => {
      photoRequests.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'image/png', body: KURTA_PHOTO.buffer });
    });
    await page.goto('/en/category/kurtas');
    await expect(page.getByRole('heading', { name: 'Kurtas', level: 1 })).toBeVisible();
    await noAxeViolations(page);
    const card = page.getByRole('link', { name: new RegExp(title) });
    await expect(card).toBeVisible();
    await expect(card.locator('img')).toHaveAttribute('src', /\/product-images\/.+\/medium\.webp$/);
    await expect.poll(() => photoRequests.length).toBeGreaterThan(0);

    // The product page: the address carries the readable name (D4-02).
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/en/product/${productId}/journey-block-print-kurta-${n}$`));
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    await expect(page.getByText('₹1,499.50')).toBeVisible();
    await noAxeViolations(page);

    // Not logged in: Add to cart goes to login, and the add runs once on the way back (D2-02).
    await expect(page.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page).toHaveURL(/\/en\/login$/);
    await logIn(page, freshPhone());
    await expect(page).toHaveURL(new RegExp(`/en/product/${productId}/`));
    await expect(page.getByRole('status').filter({ hasText: 'Added to cart' })).toBeVisible();
    expect((await customer.cookies()).map((c) => c.name)).not.toContain('__Host-dhaaga_pa');
    await expect(page.getByRole('link', { name: /^Cart\s*1\s*item$/ })).toBeVisible();

    // A reload does not add it again.
    await page.reload();
    await expect(page.getByRole('link', { name: /^Cart\s*1\s*item$/ })).toBeVisible();

    // The cart: the line, its seller, the totals the backend sends, no checkout.
    await page.getByRole('link', { name: /^Cart\s*1\s*item$/ }).click();
    await expect(page.getByRole('heading', { name: 'Your cart', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: title })).toBeVisible();
    await expect(page.getByText(`Sold by ${shop}`)).toBeVisible();
    await expect(page.getByText('Shipping charges are not calculated yet. Checkout is coming soon. Your cart is saved.')).toBeVisible();
    await expect(page.getByRole('button', { name: /checkout/i })).toHaveCount(0);
    await noAxeViolations(page);

    // Quantity and a coupon that does not exist (a preview, never an error).
    await page.getByLabel('Quantity').selectOption('2');
    await expect(page.getByText('Items (2)')).toBeVisible();
    await page.getByLabel('Coupon code').fill('NOSUCHCODE');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('This coupon code does not exist.')).toBeVisible();
    await page.getByRole('button', { name: /^Remove\s*:/ }).click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await customer.close();
  });
});
