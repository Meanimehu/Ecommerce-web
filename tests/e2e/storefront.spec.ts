import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog, freshPhone, pageAs } from './support/login';
import { countFirstLoad, expectWithinBudget } from './support/page-size';
import { approvedProduct, staff, twoSizesAndColours } from './support/products';

/**
 * The storefront (Document 5, sections 6.1 and 6.2; Document 4, D4-02): category pages with "Load more", product pages
 * and their addresses, choosing a size and a colour, and adding to the cart. Written before the step 8 clean-up and
 * passing on the code before it, so it describes what must not change (Document 7, 20.13). Products are set up by
 * calling the backend directly, as in slice-2-journey.spec.ts. Against the real local backend; skipped where it is not
 * running.
 */
const BACKEND = `${process.env.E2E_BACKEND_URL ?? 'http://localhost:3000'}/api/v1`;
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
/** The category page shows 24 products, then "Load more". */
const FIRST_BATCH = 24;

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

test.describe('the storefront', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(180_000);

  test('a product that is not visible is a real 404, and a missing or wrong name part redirects to the full address', async ({
    page,
  }) => {
    const missing = await page.goto('/en/product/00000000-0000-4000-8000-000000000000/anything');
    expect(missing?.status()).toBe(404);
    expect((await page.goto('/en/category/no-such-category'))?.status()).toBe(404);

    await page.goto('/en/category/women');
    const first = page.locator('main a[href*="/product/"]').first();
    const href = (await first.getAttribute('href')) ?? '';
    const id = href.split('/')[3] ?? '';
    const short = await page.request.get(`/en/product/${id}`, { maxRedirects: 0 });
    expect(short.status()).toBe(308);
    expect(short.headers().location).toBe(href);
    const wrong = await page.request.get(`/en/product/${id}/wrong-name`, { maxRedirects: 0 });
    expect(wrong.status()).toBe(308);
  });

  test('the old short addresses /c/… and /p/… are a real 404, not redirected (Document 7, 20.13, step 8)', async ({
    page,
  }) => {
    await page.goto('/en/category/women');
    const href =
      (await page.locator('main a[href*="/product/"]').first().getAttribute('href')) ?? '';
    const [, , , id, name] = href.split('/');
    for (const old of ['/en/c/women', `/en/p/${id}/${name}`, `/hi/p/${id}`]) {
      const answer = await page.request.get(old, { maxRedirects: 0 });
      expect(answer.status(), old).toBe(404);
    }
  });

  test('category and product pages, in English and Hindi, stay inside the first-load budget, and photos may load only from the photo host', async ({
    browser,
  }) => {
    // One page's first load, on an empty cache (Document 6, section 14).
    async function firstLoad(address: string, lang: 'en' | 'hi') {
      const page = await browser.newPage({
        baseURL: test.info().project.use.baseURL,
        ignoreHTTPSErrors: true,
      });
      const counted = countFirstLoad(page, lang);
      const answer = await page.goto(address, { waitUntil: 'networkidle' });
      expectWithinBudget(address, lang, await counted());
      return { page, answer };
    }
    const category = await firstLoad('/en/category/women', 'en');
    expect(category.answer?.headers()['content-security-policy']).toMatch(
      /^img-src 'self' data: blob:/,
    );
    const productAddress =
      (await category.page.locator('main a[href*="/product/"]').first().getAttribute('href')) ?? '';
    await firstLoad(productAddress, 'en');
    await firstLoad('/hi/category/women', 'hi');
    await firstLoad(productAddress.replace(/^\/en\//, '/hi/'), 'hi');
  });

  test('choosing a size and a colour: what is not in stock is crossed out, the button waits for a choice, and the price follows it; a logged-in customer adds it', async ({
    browser,
  }) => {
    const { vendor, moderator } = await staff(browser);
    const { sizes, colours } = await twoSizesAndColours(vendor);
    const [small, medium] = sizes as [
      { code: string; label: string },
      { code: string; label: string },
    ];
    const [first, second] = colours as [
      { code: string; label: string },
      { code: string; label: string },
    ];
    const title = `Storefront choice kurta ${Date.now()}`;
    const id = await approvedProduct(vendor, moderator, title, [
      { sizeCode: small.code, colourCode: first.code, pricePaise: 99900, stock: 20 },
      { sizeCode: medium.code, colourCode: first.code, pricePaise: 109900, stock: 0 },
      { sizeCode: medium.code, colourCode: second.code, pricePaise: 119900, stock: 3 },
    ]);

    const customer = await pageAs(browser, freshPhone(), '/en/account');
    await customer.goto(`/en/product/${id}`);
    await expect(customer.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    const addButton = customer.getByRole('button', { name: 'Add to cart' });
    await expect(addButton).toBeDisabled();
    await expect(
      customer.getByText('Choose a size and a colour to add this to your cart.'),
    ).toBeVisible();

    // A size: the colours that size has no stock in are crossed out and cannot be chosen.
    await customer.getByRole('button', { name: small.label, exact: true }).click();
    await expect(customer.getByRole('button', { name: small.label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(
      customer.getByRole('button', { name: `${second.label}, Unavailable` }),
    ).toHaveAttribute('aria-disabled', 'true');
    await expect(customer.getByText('Choose a colour to add this to your cart.')).toBeVisible();
    await customer
      .getByRole('button', { name: `${second.label}, Unavailable` })
      .click({ force: true });
    await expect(
      customer.getByRole('button', { name: `${second.label}, Unavailable` }),
    ).toHaveAttribute('aria-pressed', 'false');

    // Both chosen: the button is on, and the price is that variant's.
    await customer.getByRole('button', { name: first.label, exact: true }).click();
    await expect(addButton).toBeEnabled();
    await expect(customer.getByText('₹999', { exact: true })).toBeVisible();
    await expect(customer.getByText('In stock', { exact: true })).toBeVisible();
    await expect(
      customer.getByRole('button', { name: `${medium.label}, Unavailable` }),
    ).toHaveAttribute('aria-disabled', 'true');
    await noAxeViolations(customer);

    // Logged in: the add happens here, with a link to the cart.
    await addButton.click();
    const added = customer.getByRole('status').filter({ hasText: 'Added to cart' });
    await expect(added).toBeVisible();
    await expect(added.getByRole('link', { name: 'View cart' })).toHaveAttribute(
      'href',
      '/en/cart',
    );
    await expect(customer.getByRole('link', { name: /^Cart\s*1\s*item$/ })).toBeVisible();
  });

  test('a category with more than one batch: "Load more" adds the next cards, says how many are shown, and keeps the keyboard focus', async ({
    browser,
    page,
  }) => {
    const firstPage = (await (
      await fetch(`${BACKEND}/catalogue/products?categorySlug=kurtas&limit=1`)
    ).json()) as { total: number };
    if (firstPage.total <= FIRST_BATCH) {
      // Test set-up only: enough approved products for a second batch.
      const { vendor, moderator } = await staff(browser);
      const { sizes, colours } = await twoSizesAndColours(vendor);
      for (let count = firstPage.total; count <= FIRST_BATCH; count += 1) {
        await approvedProduct(vendor, moderator, `Storefront batch kurta ${Date.now()}`, [
          {
            sizeCode: sizes[0]?.code ?? '',
            colourCode: colours[0]?.code ?? '',
            pricePaise: 49900,
            stock: 1,
          },
        ]);
      }
    }
    // Our server keeps the first batch for up to 60 seconds (Document 7, section 12). A product
    // made since would move the later batches by one, so wait until the page's total is the
    // backend's: then every batch is read from the same list.
    const backendTotal = (
      (await (await fetch(`${BACKEND}/catalogue/products?categorySlug=kurtas&limit=1`)).json()) as {
        total: number;
      }
    ).total;
    await expect(async () => {
      await page.goto('/en/category/kurtas');
      await expect(page.getByText(`Showing 24 of ${backendTotal}`)).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 75_000, intervals: [5_000] });
    const cards = page.locator('main ul > li > a[href*="/product/"]');
    await expect(cards).toHaveCount(FIRST_BATCH);
    const total = backendTotal;
    expect(total).toBeGreaterThan(FIRST_BATCH);
    // Pressed with the keyboard, batch by batch, until every product is shown (Document 6, 8.8).
    const loadMore = page.getByRole('button', { name: 'Load more' });
    let shown = FIRST_BATCH;
    while (shown < total) {
      const shownBefore = shown;
      shown = Math.min(total, shown + FIRST_BATCH);
      await loadMore.focus();
      await page.keyboard.press('Enter');
      await expect(cards).toHaveCount(shown);
      await expect(
        page.getByRole('status').filter({ hasText: `${shown - shownBefore} more products shown` }),
      ).toBeAttached();
      if (shown < total) {
        await expect(page.getByText(`Showing ${shown} of ${total}`)).toBeVisible();
        // More remain: focus stays on the button, so the next press loads more.
        await expect(loadMore).toBeFocused();
      } else {
        await expect(loadMore).toHaveCount(0);
        // The last batch: the button is gone, and focus is on the first card added.
        await expect(cards.nth(shownBefore)).toBeFocused();
      }
    }
    await noAxeViolations(page);
  });

  test('the Hindi category and product pages', async ({ page }) => {
    await page.goto('/hi/category/kurtas');
    await expect(page.getByRole('navigation', { name: 'आप यहाँ हैं' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kurtas', level: 1 })).toBeVisible();
    await expect(page.getByText(/^\d+ उत्पाद$/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'और दिखाएँ' })).toBeVisible();
    await noAxeViolations(page);
    await page.locator('main ul > li > a[href*="/product/"]').first().click();
    await expect(page).toHaveURL(/\/hi\/product\/[^/]+\/[a-z0-9-]+$/);
    await expect(page.getByRole('button', { name: 'कार्ट में जोड़ें' })).toBeVisible();
    await expect(page.getByText(/^विक्रेता /)).toBeVisible();
    await noAxeViolations(page);
  });
});
