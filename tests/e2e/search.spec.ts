import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { countFirstLoad, expectWithinBudget } from './support/page-size';
import { approvedProduct, staff, twoSizesAndColours } from './support/products';

/**
 * Search and the storefront header (Document 5, sections 5 and 6.1; Document 6, 7.3; Document 8,
 * Slice 3 notes): suggestions while typing with the keyboard, the results page with the same
 * filters and sort, nothing found, the search working before any script, the category row, the
 * compact menu and the footer. A product with a word of its own is made, so it is the only match.
 * Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const PHONE = { width: 390, height: 844 };
/** Search answers are kept for 30 seconds and suggestions for 10 (Document 7, section 12). */
const KEPT = { timeout: 45_000, intervals: [3_000] };

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

test.describe('search and the storefront header', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(180_000);

  /** A word no other product has, such as "zarifa4821937". */
  let word: string;
  let title: string;

  test.beforeAll(async ({ browser }) => {
    const people = await staff(browser);
    const { sizes, colours } = await twoSizesAndColours(people.vendor);
    word = `zarifa${String(Date.now()).slice(-7)}`;
    title = `Search kurta ${word}`;
    await approvedProduct(people.vendor, people.moderator, title, [
      {
        sizeCode: sizes[0]?.code ?? '',
        colourCode: colours[0]?.code ?? '',
        pricePaise: 149900,
        stock: 3,
      },
    ]);
  });

  test('suggestions while typing: asked once typing pauses, chosen with the keyboard', async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);
    await page.goto('/en');
    const asked: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/catalogue/suggest')) asked.push(request.url());
    });
    const box = page.getByRole('combobox', { name: 'Search the shop' });
    await expect(box).toHaveCount(1);
    await box.pressSequentially(word, { delay: 30 });
    const list = page.getByRole('listbox', { name: 'Search the shop' });
    const option = list.getByRole('option', { name: title });
    await expect(async () => {
      await expect(option).toBeVisible({ timeout: 2_000 });
    }).toPass(KEPT);
    // Typing fast sends one request for the whole word, not one per letter.
    expect(asked.length).toBeLessThan(word.length / 2);
    await expect(list.getByRole('group', { name: 'Products' })).toBeVisible();
    await expect(box).toHaveAttribute('aria-expanded', 'true');
    await noAxeViolations(page);

    // Down chooses the first suggestion; Escape closes the list; Enter opens the chosen one.
    await box.press('ArrowDown');
    const activeId = await box.getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    await expect(page.locator(`[id="${activeId}"]`)).toHaveAttribute('aria-selected', 'true');
    await box.press('Escape');
    await expect(list).toBeHidden();
    await expect(box).toHaveAttribute('aria-expanded', 'false');
    await box.press('ArrowDown');
    await expect(list).toBeVisible();
    await box.press('Enter');
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
  });

  test('the results page: what was searched, the same filters and sort with the text kept, not indexed', async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);
    await page.goto('/en');
    const box = page.getByRole('combobox', { name: 'Search the shop' });
    await box.fill(word);
    // Enter with no suggestion chosen opens the results.
    await expect(async () => {
      await page.goto(`/en/search?q=${word}`);
      await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible({
        timeout: 2_000,
      });
    }).toPass(KEPT);
    await page.goto('/en');
    await box.fill(word);
    await box.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/en/search\\?q=${word}$`));
    await expect(
      page.getByRole('heading', { name: `Results for “${word}”`, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('main').getByText('1 product', { exact: true }).first(),
    ).toBeVisible();
    // The box keeps what was searched, and the best match is the first order.
    await expect(page.getByRole('combobox', { name: 'Search the shop' })).toHaveValue(word);
    await expect(page.getByRole('combobox', { name: 'Sort' })).toHaveValue('relevance');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await noAxeViolations(page);

    // A filter keeps the search text in the address.
    await page.getByRole('combobox', { name: 'Sort' }).selectOption('price_asc');
    await expect(page).toHaveURL(new RegExp(`[?&]q=${word}&sort=price_asc$`));
    await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();

    // In Hindi.
    await page.goto(`/hi/search?q=${word}`);
    await expect(page.getByRole('heading', { name: `“${word}” के नतीजे`, level: 1 })).toBeVisible();
  });

  test('nothing found: it says so and offers categories; no text asks for some', async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);
    const nothing = `qqxv${Date.now()}`;
    await page.goto(`/en/search?q=${nothing}`);
    await expect(page.getByText(`Nothing matches “${nothing}”`, { exact: false })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Kurtas' })).toHaveAttribute(
      'href',
      '/en/category/kurtas',
    );
    await noAxeViolations(page);
    await page.goto('/en/search');
    await expect(page.getByRole('heading', { name: 'Search', level: 1 })).toBeVisible();
    await expect(page.getByText('Type what you are looking for in the search box.')).toBeVisible();
  });

  test('the search box works before any script: it is a plain form', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      ignoreHTTPSErrors: true,
      baseURL: test.info().project.use.baseURL,
      viewport: WIDE,
    });
    const page = await context.newPage();
    await page.goto('/en/login');
    await page.locator('#search-wide').fill(word);
    await page.locator('#search-wide').press('Enter');
    await expect(page).toHaveURL(new RegExp(`/en/search\\?q=${word}$`));
    await expect(
      page.getByRole('heading', { name: `Results for “${word}”`, level: 1 }),
    ).toBeVisible();
    await context.close();
  });

  test('the header: the category row on wide screens; on a phone the menu holds the language switch and the categories; the footer', async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);
    await page.goto('/en/login');
    const header = page.getByRole('banner');
    const row = header.getByRole('navigation', { name: 'Categories' });
    await expect(row.getByRole('link', { name: 'Women' })).toHaveAttribute(
      'href',
      '/en/category/women',
    );
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: 'हिन्दी' })).toHaveAttribute('href', '/hi/login');
    await expect(footer.getByRole('link', { name: 'Dhaaga' })).toHaveAttribute('href', '/en');

    await page.setViewportSize(PHONE);
    await expect(row).toBeHidden();
    await expect(header.getByRole('link', { name: 'हिन्दी' })).toBeHidden();
    await header.locator('summary', { hasText: 'Menu' }).click();
    await expect(header.getByRole('link', { name: 'हिन्दी' })).toBeVisible();
    await expect(
      header.getByRole('navigation', { name: 'Categories' }).getByRole('link', { name: 'Women' }),
    ).toBeVisible();
    await noAxeViolations(page);
    await header.locator('summary', { hasText: 'Menu' }).click();
    await expect(header.getByRole('link', { name: 'हिन्दी' })).toBeHidden();
    // On a phone the search box has its own row.
    await expect(page.getByRole('combobox', { name: 'Search the shop' })).toBeVisible();
  });

  test('the search page stays inside the first-load budget in English and Hindi', async ({
    browser,
  }) => {
    for (const lang of ['en', 'hi'] as const) {
      const page = await browser.newPage({
        baseURL: test.info().project.use.baseURL,
        ignoreHTTPSErrors: true,
      });
      const address = `/${lang}/search?q=kurta`;
      const counted = countFirstLoad(page, lang);
      await page.goto(address, { waitUntil: 'networkidle' });
      expectWithinBudget(address, lang, await counted());
      await page.close();
    }
  });
});
