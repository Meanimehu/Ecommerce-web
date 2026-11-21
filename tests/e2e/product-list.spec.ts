import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { countFirstLoad, expectWithinBudget } from './support/page-size';
import { approvedProduct, BACKEND, staff, twoSizesAndColours } from './support/products';

/**
 * Filters and sort on a list of products (Document 5, section 6.1; Document 6, 8.8; Document 8,
 * Slice 3 notes): size, colour, price and brand with the backend's counts, the sort, the chosen
 * filters as chips, all kept in the address; on a phone a full-height sheet with "Show N results".
 * Three products are made in Kurtas with prices in a band of their own, so a price filter gives
 * exactly them. Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const PHONE = { width: 390, height: 844 };
const KURTAS = '/en/category/kurtas';

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

/** A filter choice's checkbox: its name is the value and its count, such as "M 2". */
const choice = (scope: Page | ReturnType<Page['locator']>, label: string) =>
  scope.getByRole('checkbox', { name: new RegExp(`^${label}\\s+\\d+$`) });

/** The count under the heading (the same words are also said to screen readers after a change). */
const countText = (page: Page, text: string) =>
  page.getByRole('main').getByText(text, { exact: true }).first();

/** The cards' titles, in the order shown. */
const cardTitles = (page: Page) =>
  page.locator('main a[href*="/product/"] span.line-clamp-2').allTextContents();

type Made = {
  low: number;
  titles: [string, string, string];
  sizes: { code: string; label: string }[];
  colours: { code: string; label: string }[];
};

/**
 * Three approved products in Kurtas, at low, low + 1 and low + 2 rupees: the first in the first
 * size and colour, the other two in the second size, in the first and second colour.
 */
async function threeProducts(browser: Browser): Promise<Made> {
  const people = await staff(browser);
  const { sizes, colours } = await twoSizesAndColours(people.vendor);
  const low = 60_000 + (Date.now() % 30_000);
  const stamp = Date.now();
  const titles: Made['titles'] = [
    `Filter kurta A ${stamp}`,
    `Filter kurta B ${stamp}`,
    `Filter kurta C ${stamp}`,
  ];
  const variants = [
    { size: sizes[0], colour: colours[0] },
    { size: sizes[1], colour: colours[0] },
    { size: sizes[1], colour: colours[1] },
  ];
  for (const [index, title] of titles.entries()) {
    const variant = variants[index];
    await approvedProduct(people.vendor, people.moderator, title, [
      {
        sizeCode: variant?.size?.code ?? '',
        colourCode: variant?.colour?.code ?? '',
        pricePaise: (low + index) * 100,
        stock: 5,
      },
    ]);
  }
  return { low, titles, sizes, colours };
}

/** One page of a product list holds 24 cards, so "Load more" needs at least one more. */
const LIST_PAGE = 24;

/**
 * Makes sure Kurtas has more products than one page holds, adding approved ones as needed, so the
 * test does not depend on what earlier runs left in the local database.
 */
async function moreThanOnePage(browser: Browser) {
  const answer = (await (
    await fetch(`${BACKEND}/catalogue/products?categorySlug=kurtas&limit=1`)
  ).json()) as {
    total: number;
  };
  const missing = LIST_PAGE + 1 - answer.total;
  if (missing <= 0) return;
  const people = await staff(browser);
  const { sizes, colours } = await twoSizesAndColours(people.vendor);
  const stamp = Date.now();
  for (let count = 0; count < missing; count++) {
    await approvedProduct(people.vendor, people.moderator, `Page kurta ${stamp}-${count}`, [
      {
        sizeCode: sizes[0]?.code ?? '',
        colourCode: colours[0]?.code ?? '',
        pricePaise: 149_900,
        stock: 5,
      },
    ]);
  }
}

test.describe('filters and sort', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(180_000);

  let made: Made;
  test.beforeAll(async ({ browser }) => {
    made = await threeProducts(browser);
  });

  const band = () => `minPrice=${made.low}&maxPrice=${made.low + 2}`;

  test('our endpoint passes every filter to the backend, and the answer holds the counts', async ({
    request,
  }) => {
    const answer = await request.get(
      `/api/catalogue/products?categorySlug=kurtas&minPrice=${made.low * 100}&maxPrice=${(made.low + 2) * 100}&size=${made.sizes[1]?.code}&sort=price_desc`,
    );
    expect(answer.ok()).toBe(true);
    const body = (await answer.json()) as {
      total: number;
      items: { title: string }[];
      facets: { sizes: { code: string; count: number }[] };
    };
    expect(body.total).toBe(2);
    expect(body.items.map((item) => item.title)).toEqual([made.titles[2], made.titles[1]]);
    // A size's count leaves out the size filter itself (area-3a-catalogue.md, facets).
    expect(body.facets.sizes.find((size) => size.code === made.sizes[0]?.code)?.count).toBe(1);
  });

  test('on a wide screen: choosing a size, the sort and removing filters, all kept in the address', async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);
    await page.goto(`${KURTAS}?${band()}`);
    const panel = page.getByRole('complementary', { name: 'Filters' });
    await expect(countText(page, '3 products')).toBeVisible();
    expect(await cardTitles(page)).toEqual([...made.titles].reverse());
    // The price chip says the band in rupees.
    await expect(page.getByRole('button', { name: /^Remove ₹[\d,]+ to ₹[\d,]+$/ })).toBeVisible();

    // A size: the address, the count, the chip and the box follow.
    const size = made.sizes[1]?.label ?? '';
    await choice(panel, size).check();
    await expect(page).toHaveURL(new RegExp(`[?&]size=${made.sizes[1]?.code}(&|$)`));
    await expect(countText(page, '2 products')).toBeVisible();
    await expect(page.getByRole('button', { name: `Remove Size ${size}` })).toBeVisible();
    await expect(choice(panel, size)).toBeChecked();
    await expect(choice(panel, size)).toBeFocused();

    // The sort: price, high to low.
    await page.getByRole('combobox', { name: 'Sort' }).selectOption('price_desc');
    await expect(page).toHaveURL(/[?&]sort=price_desc(&|$)/);
    await expect.poll(() => cardTitles(page)).toEqual([made.titles[2], made.titles[1]]);

    // A filtered or sorted list is not indexed, and points to the plain list.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`${KURTAS}$`),
    );
    await noAxeViolations(page);

    // A reload keeps everything; Back goes to the choice before.
    await page.reload();
    await expect(choice(panel, size)).toBeChecked();
    await expect(page.getByRole('combobox', { name: 'Sort' })).toHaveValue('price_desc');
    await page.goBack();
    await expect(page).not.toHaveURL(/sort=/);
    await page.goForward();

    // Removing the size chip, then "Clear all", which keeps the sort.
    await page.getByRole('button', { name: `Remove Size ${size}` }).click();
    await expect(page).not.toHaveURL(/[?&]size=/);
    await expect(countText(page, '3 products')).toBeVisible();
    await page.getByRole('button', { name: 'Clear all', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${KURTAS}\\?sort=price_desc$`));
  });

  test('the price filter, and a choice that matches nothing', async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto(KURTAS);
    const panel = page.getByRole('complementary', { name: 'Filters' });
    await panel.getByLabel('Lowest price (₹)').fill(String(made.low));
    await panel.getByLabel('Highest price (₹)').fill(String(made.low + 1));
    await panel.getByRole('button', { name: 'Apply' }).click();
    // Names in the address are in alphabetical order, so equal choices give one address.
    await expect(page).toHaveURL(new RegExp(`maxPrice=${made.low + 1}&minPrice=${made.low}`));
    await expect(countText(page, '2 products')).toBeVisible();
    expect(await cardTitles(page)).toEqual([made.titles[1], made.titles[0]]);

    // A choice with no products is not offered: with the first size chosen, the second colour has
    // none in this band, so it is hidden.
    await choice(panel, made.sizes[0]?.label ?? '').check();
    await expect(countText(page, '1 product')).toBeVisible();
    await expect(choice(panel, made.colours[1]?.label ?? '')).toHaveCount(0);
    // A shared address can still hold such a choice: nothing matches, and the page says so.
    await page.goto(
      `${KURTAS}?${band()}&size=${made.sizes[0]?.code}&colour=${made.colours[1]?.code}`,
    );
    await expect(page.getByText('No products match these filters')).toBeVisible();
    // The chosen colour has no count from the backend now; it stays, by its code, to be unticked.
    await expect(choice(panel, made.colours[1]?.code ?? '')).toBeChecked();
    await noAxeViolations(page);
    await page.getByRole('button', { name: 'Clear all filters' }).last().click();
    await expect(page).toHaveURL(new RegExp(`${KURTAS}$`));
  });

  test('on a phone the filters open in a full-height sheet with "Show N results"', async ({
    page,
  }) => {
    await page.setViewportSize(PHONE);
    await page.goto(`${KURTAS}?${band()}`);
    await expect(page.getByRole('complementary', { name: 'Filters' })).toBeHidden();
    const opener = page.getByRole('button', { name: 'Filters · 1' });
    await opener.click();
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await expect(sheet).toBeVisible();
    await choice(sheet, made.sizes[1]?.label ?? '').check();
    await expect(sheet.getByRole('button', { name: 'Show 2 results' })).toBeVisible();
    await noAxeViolations(page);
    await sheet.getByRole('button', { name: 'Show 2 results' }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('button', { name: 'Filters · 2' })).toBeFocused();
    expect(await cardTitles(page)).toEqual([made.titles[2], made.titles[1]]);

    // Escape closes it too.
    await page.getByRole('button', { name: 'Filters · 2' }).click();
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  test('the filters in Hindi', async ({ page }) => {
    await page.setViewportSize(WIDE);
    await page.goto(`/hi/category/kurtas?${band()}&sort=price_asc`);
    const panel = page.getByRole('complementary', { name: 'फ़िल्टर' });
    await expect(panel.getByRole('group', { name: 'साइज़' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'क्रम' })).toHaveValue('price_asc');
    await expect(page.getByRole('button', { name: 'सब हटाएँ' })).toBeVisible();
    await noAxeViolations(page);
  });

  test('a filtered category page stays inside the first-load budget in English and Hindi', async ({
    browser,
  }) => {
    for (const lang of ['en', 'hi'] as const) {
      const page = await browser.newPage({
        baseURL: test.info().project.use.baseURL,
        ignoreHTTPSErrors: true,
      });
      const address = `/${lang}/category/kurtas?${band()}&sort=price_desc`;
      const counted = countFirstLoad(page, lang);
      await page.goto(address, { waitUntil: 'networkidle' });
      expectWithinBudget(address, lang, await counted());
      await page.close();
    }
  });

  test('a "Load more" that fails says so in place, keeps the cards, and "Try again" loads them', async ({
    page,
    browser,
  }) => {
    await moreThanOnePage(browser);
    await page.setViewportSize(WIDE);
    const cards = page.locator('main ul > li > a[href*="/product/"]');
    const loadMore = page.getByRole('button', { name: 'Load more' });
    // Our server keeps a list for up to 60 seconds, so new products can take that long to show.
    await expect(async () => {
      await page.goto(KURTAS);
      await expect(loadMore).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 75_000 });
    await expect(cards).toHaveCount(LIST_PAGE);
    // The next batch fails once.
    let failed = false;
    await page.route('**/api/catalogue/products?*', async (route) => {
      if (failed) return route.continue();
      failed = true;
      return route.fulfill({ status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE' } } });
    });
    await loadMore.click();
    // Next.js keeps its own route announcer (also an alert) outside main.
    const loadError = page.getByRole('main').getByRole('alert');
    await expect(loadError).toBeVisible();
    await expect(cards).toHaveCount(LIST_PAGE);
    await noAxeViolations(page);
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect.poll(() => cards.count()).toBeGreaterThan(LIST_PAGE);
    await expect(loadError).toHaveCount(0);
  });
});
