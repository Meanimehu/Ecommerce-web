import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { backendLog, freshPhone, logIn, pageAs } from './support/login';
import {
  admin,
  approvedProduct,
  backend,
  setStock,
  staff,
  twoSizesAndColours,
  variantsOf,
} from './support/products';
import { countFirstLoad, expectWithinBudget } from './support/page-size';
import { nextRequestBody } from './support/requests';

/**
 * The cart (Document 5, section 6.3; Document 2, D2-02): it needs a login, an add made before
 * logging in runs once on the way back, and the cart page changes quantities, removes lines,
 * previews coupons and clears what can no longer be bought, always showing the backend's answer.
 * Written before the step 9 clean-up and passing on the code before it, so it describes what must
 * not change (Document 7, 20.13). Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

/** A logged-in customer with a fresh, empty cart. */
const newCustomer = (browser: Browser, lang: 'en' | 'hi' = 'en') =>
  pageAs(browser, freshPhone(), `/${lang}/account`);

test.describe('the cart', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');

  // One product for every test: size S (in stock) and size M (5 left), one colour.
  const product = { id: '', title: '', smallLabel: '', smallId: '', mediumId: '' };
  let vendor: Page;

  test.beforeAll(async ({ browser }) => {
    const people = await staff(browser);
    vendor = people.vendor;
    const { sizes, colours } = await twoSizesAndColours(vendor);
    const [small, medium] = sizes as [
      { code: string; label: string },
      { code: string; label: string },
    ];
    const colour = colours[0]?.code ?? '';
    product.title = `Cart kurta ${Date.now()}`;
    product.smallLabel = small.label;
    product.id = await approvedProduct(vendor, people.moderator, product.title, [
      { sizeCode: small.code, colourCode: colour, pricePaise: 99900, stock: 20 },
      { sizeCode: medium.code, colourCode: colour, pricePaise: 109900, stock: 5 },
    ]);
    const variants = await variantsOf(vendor, product.id);
    product.smallId = variants.find((variant) => variant.sizeCode === small.code)?.id ?? '';
    product.mediumId = variants.find((variant) => variant.sizeCode === medium.code)?.id ?? '';
  });

  test('someone not logged in who opens the cart goes to login and comes back', async ({
    browser,
  }) => {
    const page = await pageAs(browser, freshPhone(), '/en/cart');
    await expect(page).toHaveURL(/\/en\/cart$/);
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute(
      'href',
      '/en',
    );
    await noAxeViolations(page);
  });

  test('an add made before logging in runs once on the way back, with a notice and the header count', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      baseURL: test.info().project.use.baseURL,
      viewport: test.info().project.use.viewport,
    });
    const page = await context.newPage();
    await page.goto(`/en/product/${product.id}`);
    await page.getByRole('button', { name: product.smallLabel, exact: true }).click();
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page).toHaveURL(/\/en\/login$/);
    expect((await context.cookies()).map((cookie) => cookie.name)).toContain('__Host-dhaaga_pa');

    await logIn(page, freshPhone());
    await expect(page).toHaveURL(new RegExp(`/en/product/${product.id}/`));
    await expect(page.getByRole('status').filter({ hasText: 'Added to cart' })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Cart\s*1\s*item$/ })).toBeVisible();
    expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain(
      '__Host-dhaaga_pa',
    );

    // A reload does not add it again.
    await page.reload();
    await expect(page.getByRole('link', { name: /^Cart\s*1\s*item$/ })).toBeVisible();
    await context.close();
  });

  test('changing a quantity sends only the new quantity, and the cart shows the backend totals, also after a reload', async ({
    browser,
  }) => {
    const customer = await newCustomer(browser);
    await backend(customer, 'POST', '/cart/items', { variantId: product.smallId, quantity: 1 });
    await customer.goto('/en/cart');
    await expect(customer.getByRole('heading', { name: 'Your cart', level: 1 })).toBeVisible();
    await expect(customer.getByRole('link', { name: product.title })).toBeVisible();
    await expect(customer.getByText('Items (1)')).toBeVisible();
    await expect(customer.getByText('Sold by ', { exact: false }).first()).toBeVisible();
    await expect(customer.getByRole('button', { name: /checkout/i })).toHaveCount(0);
    await noAxeViolations(customer);

    const sent = nextRequestBody(customer, 'PATCH', /^\/api\/cart\/items\/[^/]+$/);
    await customer.getByLabel('Quantity').selectOption('3');
    expect(await sent).toEqual({ quantity: 3 });
    await expect(customer.getByText('Items (3)')).toBeVisible();
    await expect(customer.getByRole('link', { name: /^Cart\s*3\s*items$/ })).toBeVisible();

    await customer.reload();
    await expect(customer.getByLabel('Quantity')).toHaveValue('3');
    await expect(customer.getByText('Items (3)')).toBeVisible();
  });

  test('removing a line leaves the empty cart, with a way back to the shop', async ({
    browser,
  }) => {
    const customer = await newCustomer(browser);
    await backend(customer, 'POST', '/cart/items', { variantId: product.smallId, quantity: 2 });
    await customer.goto('/en/cart');
    const removed = customer.waitForRequest(
      (request) =>
        request.method() === 'DELETE' &&
        /^\/api\/cart\/items\/[^/]+$/.test(new URL(request.url()).pathname),
    );
    await customer
      .getByRole('button', { name: new RegExp(`^Remove\\s*: ${product.title}$`) })
      .click();
    await removed;
    await expect(customer.getByText('Your cart is empty')).toBeVisible();
    await expect(customer.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute(
      'href',
      '/en',
    );
  });

  test('a coupon that does not apply shows the reason, and removing it clears it', async ({
    browser,
  }) => {
    const customer = await newCustomer(browser);
    await backend(customer, 'POST', '/cart/items', { variantId: product.smallId, quantity: 1 });
    await customer.goto('/en/cart');
    const asked = customer.waitForRequest(
      (request) =>
        new URL(request.url()).searchParams.get('couponCode')?.toUpperCase() === 'NOSUCHCODE',
    );
    // The field shows capitals; the backend ignores case when it matches a code.
    await customer.getByLabel('Coupon code').fill('nosuchcode');
    await customer.getByRole('button', { name: 'Apply' }).click();
    await asked;
    await expect(customer.getByText('This coupon code does not exist.')).toBeVisible();
    await customer.getByRole('button', { name: 'Remove coupon' }).click();
    await expect(customer.getByText('This coupon code does not exist.')).toHaveCount(0);
    await expect(customer.getByLabel('Coupon code')).toHaveValue('');
  });

  test('a coupon that applies shows its discount and the lower total the backend sends', async ({
    browser,
  }) => {
    const code = `CART${String(Date.now()).slice(-8)}`;
    // Test set-up only: a marketplace coupon of ₹100 off, active at once.
    await backend(await admin(browser), 'POST', '/admin/coupons', {
      code,
      discountType: 'fixed',
      value: 10000,
      fundedBy: 'marketplace',
    });
    const customer = await newCustomer(browser);
    await backend(customer, 'POST', '/cart/items', { variantId: product.smallId, quantity: 1 });
    await customer.goto('/en/cart');
    await expect(customer.getByText('Estimated total')).toBeVisible();
    await customer.getByLabel('Coupon code').fill(code);
    await customer.getByRole('button', { name: 'Apply' }).click();
    await expect(customer.getByText(`Coupon ${code} applied.`)).toBeVisible();
    await expect(customer.getByText('−₹100')).toBeVisible();
    await expect(customer.getByText('₹899', { exact: true })).toBeVisible();
  });

  test('a line that can no longer be bought is explained, and "Remove unavailable items" clears it after asking', async ({
    browser,
  }) => {
    const customer = await newCustomer(browser);
    await backend(customer, 'POST', '/cart/items', { variantId: product.mediumId, quantity: 1 });
    await setStock(vendor, product.mediumId, 0);
    try {
      await customer.goto('/en/cart');
      await expect(customer.getByText('Out of stock', { exact: true })).toBeVisible();
      await expect(
        customer.getByText(
          'This item is out of stock. Remove it, or keep it and check back later.',
        ),
      ).toBeVisible();
      await expect(
        customer.getByText('Some items in your cart can no longer be bought.'),
      ).toBeVisible();
      await expect(customer.getByLabel('Quantity')).toHaveCount(0);
      await noAxeViolations(customer);

      await customer.getByRole('button', { name: 'Remove unavailable items' }).click();
      const dialog = customer.getByRole('alertdialog', { name: 'Remove the unavailable items?' });
      await expect(dialog).toBeVisible();
      const cleared = customer.waitForRequest(
        (request) =>
          request.method() === 'DELETE' &&
          new URL(request.url()).pathname === '/api/cart/unavailable',
      );
      await dialog.getByRole('button', { name: 'Remove', exact: true }).click();
      await cleared;
      await expect(customer.getByText('Your cart is empty')).toBeVisible();
    } finally {
      await setStock(vendor, product.mediumId, 5);
    }
  });

  test('the cart page, in English and Hindi, stays inside the first-load budget', async ({
    browser,
  }) => {
    for (const lang of ['en', 'hi'] as const) {
      // Logged in, then the cart opened in a new window with an empty cache (Document 6, section 14).
      const loggedIn = await newCustomer(browser, lang);
      const context = await browser.newContext({
        storageState: await loggedIn.context().storageState(),
        ignoreHTTPSErrors: true,
        baseURL: test.info().project.use.baseURL,
      });
      const page = await context.newPage();
      const counted = countFirstLoad(page, lang);
      await page.goto(`/${lang}/cart`, { waitUntil: 'networkidle' });
      expectWithinBudget(`/${lang}/cart`, lang, await counted());
      await context.close();
    }
  });

  test('the Hindi cart page', async ({ browser }) => {
    const customer = await newCustomer(browser, 'hi');
    await backend(customer, 'POST', '/cart/items', { variantId: product.smallId, quantity: 1 });
    await customer.goto('/hi/cart');
    await expect(customer.getByRole('heading', { name: 'आपका कार्ट', level: 1 })).toBeVisible();
    await expect(customer.getByLabel('मात्रा')).toHaveValue('1');
    await expect(customer.getByRole('heading', { name: 'ऑर्डर का सारांश' })).toBeVisible();
    await expect(customer.getByLabel('कूपन कोड')).toBeVisible();
    await noAxeViolations(customer);
  });
});
