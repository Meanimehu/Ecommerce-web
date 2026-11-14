import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { KURTA_PHOTO } from './support/flows';
import { backendLog, freshPhone, pageAs } from './support/login';

/**
 * The storefront (Document 5, sections 6.1 and 6.2; Document 4, D4-02): category pages with "Load more", product pages
 * and their addresses, choosing a size and a colour, and adding to the cart. Written before the step 8 clean-up and
 * passing on the code before it, so it describes what must not change (Document 7, 20.13). Products are set up by
 * calling the backend directly, as in slice-2-journey.spec.ts. Against the real local backend; skipped where it is not
 * running.
 */
const VENDOR_PHONE = process.env.E2E_VENDOR_PHONE ?? '9000000011';
const MODERATOR_PHONE = process.env.E2E_MODERATOR_PHONE ?? '9000000002';
const BACKEND = `${process.env.E2E_BACKEND_URL ?? 'http://localhost:3000'}/api/v1`;
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
/** The category page shows 24 products, then "Load more". */
const FIRST_BATCH = 24;

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const tokenOf = async (page: Page) =>
  (await page.context().cookies()).find((cookie) => cookie.name === '__Host-dhaaga_at')?.value ?? '';

/** Test set-up only: one call to the backend as the logged-in person on `page`. */
async function backend(page: Page, method: string, path: string, body?: unknown): Promise<unknown> {
  const answer = await fetch(`${BACKEND}${path}`, {
    method,
    headers: { authorization: `Bearer ${await tokenOf(page)}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  expect(answer.ok, `${method} ${path}: ${answer.status} ${await answer.clone().text()}`).toBe(true);
  return answer.status === 204 ? null : answer.json();
}

type Variant = { sizeCode: string; colourCode: string; pricePaise: number; stock: number };

/**
 * Test set-up only: an approved product in Kurtas with these variants and stock, made by the vendor and approved by a
 * moderator through the backend. Returns its id.
 */
async function approvedProduct(vendor: Page, moderator: Page, title: string, variants: Variant[]): Promise<string> {
  const tree = (await (await fetch(`${BACKEND}/catalogue/categories`)).json()) as { items: { slug: string; id: string; children: { slug: string; id: string }[] }[] };
  const kurtas = tree.items.flatMap((node) => [node, ...node.children]).find((node) => node.slug === 'kurtas');
  const product = (await backend(vendor, 'POST', '/vendors/me/products', { title, categoryId: kurtas?.id })) as { id: string };
  const stamp = String(Date.now()).slice(-7);
  for (const [index, variant] of variants.entries()) {
    const added = (await backend(vendor, 'POST', `/vendors/me/products/${product.id}/variants`, {
      sizeCode: variant.sizeCode,
      colourCode: variant.colourCode,
      sku: `SF${stamp}-${index}`,
      mrpPaise: variant.pricePaise + 50000,
      pricePaise: variant.pricePaise,
    })) as { id: string };
    await backend(vendor, 'PUT', `/vendors/me/inventory/variants/${added.id}`, { quantity: variant.stock });
  }
  const photo = new FormData();
  photo.append('file', new Blob([KURTA_PHOTO.buffer], { type: 'image/png' }), 'kurta.png');
  const upload = await fetch(`${BACKEND}/vendors/me/products/${product.id}/images`, {
    method: 'POST',
    headers: { authorization: `Bearer ${await tokenOf(vendor)}` },
    body: photo,
  });
  expect(upload.status).toBe(201);
  await backend(vendor, 'POST', `/vendors/me/products/${product.id}/submit`);
  const review = (await backend(moderator, 'GET', `/moderation/products/${product.id}`)) as { seenUpdatedAt: string };
  await backend(moderator, 'POST', `/moderation/products/${product.id}/approve`, { seenUpdatedAt: review.seenUpdatedAt });
  return product.id;
}

/** Two sizes and two colours the product form offers. */
async function twoSizesAndColours(vendor: Page) {
  const dictionaries = (await backend(vendor, 'GET', '/catalogue/dictionaries')) as {
    sizes: { code: string; label: string }[];
    colours: { code: string; label: string }[];
  };
  const sizes = ['S', 'M'].map((code) => dictionaries.sizes.find((size) => size.code === code));
  const colours = dictionaries.colours.slice(0, 2);
  expect(sizes.every(Boolean) && colours.length === 2).toBe(true);
  return { sizes: sizes as { code: string; label: string }[], colours };
}

async function staff(browser: Browser) {
  return { vendor: await pageAs(browser, VENDOR_PHONE, '/en/vendor'), moderator: await pageAs(browser, MODERATOR_PHONE, '/en/admin') };
}

test.describe('the storefront', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(180_000);

  test('a product that is not visible is a real 404, and a missing or wrong name part redirects to the full address', async ({ page }) => {
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

  test('the old short addresses /c/… and /p/… are a real 404, not redirected (Document 7, 20.13, step 8)', async ({ page }) => {
    await page.goto('/en/category/women');
    const href = (await page.locator('main a[href*="/product/"]').first().getAttribute('href')) ?? '';
    const [, , , id, name] = href.split('/');
    for (const old of ['/en/c/women', `/en/p/${id}/${name}`, `/hi/p/${id}`]) {
      const answer = await page.request.get(old, { maxRedirects: 0 });
      expect(answer.status(), old).toBe(404);
    }
  });

  test('category and product pages stay inside the 300 KB first-load budget, and photos may load only from the photo host', async ({ browser }) => {
    // The first load of one page: document, styles, scripts and Latin fonts (Document 7, section 12).
    async function firstLoad(address: string) {
      const page = await browser.newPage({ baseURL: test.info().project.use.baseURL, ignoreHTTPSErrors: true });
      const sizes: Promise<number>[] = [];
      page.on('requestfinished', (request) => {
        if (!['document', 'stylesheet', 'script', 'font'].includes(request.resourceType())) return;
        if (request.resourceType() === 'font' && request.url().includes('devanagari')) return;
        sizes.push(request.sizes().then((s) => s.responseBodySize + s.responseHeadersSize));
      });
      const answer = await page.goto(address, { waitUntil: 'networkidle' });
      const total = (await Promise.all(sizes)).reduce((a, b) => a + b, 0);
      console.log(`${address} first load: ${(total / 1024).toFixed(1)} KB`);
      return { page, answer, total };
    }
    const category = await firstLoad('/en/category/women');
    expect(category.answer?.headers()['content-security-policy']).toMatch(/^img-src 'self' data: blob:/);
    expect(category.total).toBeLessThanOrEqual(300 * 1024);
    const productAddress = (await category.page.locator('main a[href*="/product/"]').first().getAttribute('href')) ?? '';
    const product = await firstLoad(productAddress);
    expect(product.total).toBeLessThanOrEqual(300 * 1024);
  });

  test('choosing a size and a colour: what is not in stock is crossed out, the button waits for a choice, and the price follows it; a logged-in customer adds it', async ({ browser }) => {
    const { vendor, moderator } = await staff(browser);
    const { sizes, colours } = await twoSizesAndColours(vendor);
    const [small, medium] = sizes as [{ code: string; label: string }, { code: string; label: string }];
    const [first, second] = colours as [{ code: string; label: string }, { code: string; label: string }];
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
    await expect(customer.getByText('Choose a size and a colour to add this to your cart.')).toBeVisible();

    // A size: the colours that size has no stock in are crossed out and cannot be chosen.
    await customer.getByRole('button', { name: small.label, exact: true }).click();
    await expect(customer.getByRole('button', { name: small.label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(customer.getByRole('button', { name: `${second.label}, Unavailable` })).toHaveAttribute('aria-disabled', 'true');
    await expect(customer.getByText('Choose a colour to add this to your cart.')).toBeVisible();
    await customer.getByRole('button', { name: `${second.label}, Unavailable` }).click({ force: true });
    await expect(customer.getByRole('button', { name: `${second.label}, Unavailable` })).toHaveAttribute('aria-pressed', 'false');

    // Both chosen: the button is on, and the price is that variant's.
    await customer.getByRole('button', { name: first.label, exact: true }).click();
    await expect(addButton).toBeEnabled();
    await expect(customer.getByText('₹999', { exact: true })).toBeVisible();
    await expect(customer.getByText('In stock', { exact: true })).toBeVisible();
    await expect(customer.getByRole('button', { name: `${medium.label}, Unavailable` })).toHaveAttribute('aria-disabled', 'true');
    await noAxeViolations(customer);

    // Logged in: the add happens here, with a link to the cart.
    await addButton.click();
    const added = customer.getByRole('status').filter({ hasText: 'Added to cart' });
    await expect(added).toBeVisible();
    await expect(added.getByRole('link', { name: 'View cart' })).toHaveAttribute('href', '/en/cart');
    await expect(customer.getByRole('link', { name: /^Cart\s*1\s*item$/ })).toBeVisible();
  });

  test('a category with more than one batch: "Load more" adds the next cards, says how many are shown, and keeps the keyboard focus', async ({ browser, page }) => {
    const firstPage = (await (await fetch(`${BACKEND}/catalogue/products?categorySlug=kurtas&limit=1`)).json()) as { total: number };
    if (firstPage.total <= FIRST_BATCH) {
      // Test set-up only: enough approved products for a second batch.
      const { vendor, moderator } = await staff(browser);
      const { sizes, colours } = await twoSizesAndColours(vendor);
      for (let count = firstPage.total; count <= FIRST_BATCH; count += 1) {
        await approvedProduct(vendor, moderator, `Storefront batch kurta ${Date.now()}`, [
          { sizeCode: sizes[0]?.code ?? '', colourCode: colours[0]?.code ?? '', pricePaise: 49900, stock: 1 },
        ]);
      }
    }
    await page.goto('/en/category/kurtas');
    const cards = page.locator('main ul > li > a[href*="/product/"]');
    await expect(cards).toHaveCount(FIRST_BATCH);
    const total = Number((await page.getByText(/^Showing 24 of \d+$/).textContent())?.match(/of (\d+)/)?.[1]);
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
      await expect(page.getByRole('status').filter({ hasText: `${shown - shownBefore} more products shown` })).toBeAttached();
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
