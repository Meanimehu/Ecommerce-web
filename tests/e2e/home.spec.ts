import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { admin, approvedProduct, newBrand, staff, twoSizesAndColours } from './support/products';

/**
 * The home page and the brand page (Document 5, sections 6.1 and 8.1, D5-12, D5-16; Document 6,
 * 7.4 and 12.4; Document 8, Slice 3 notes): the text-only hero, "Shop by category", "Brands", New
 * arrivals, and a brand's own list with no brand filter. A brand and a product of it are made by
 * calling the backend. Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const PHONE = { width: 390, height: 844 };
/** Pages are kept for 60 seconds (Document 7, section 12), so a new product or brand may take a minute. */
const KEPT = { timeout: 75_000, intervals: [5_000] };

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

test.describe('the home page and brand pages', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(240_000);

  let brand: { id: string; name: string; slug: string };
  let title: string;

  test.beforeAll(async ({ browser }) => {
    const people = await staff(browser);
    const { sizes, colours } = await twoSizesAndColours(people.vendor);
    const stamp = Date.now();
    brand = await newBrand(await admin(browser), `Home brand ${stamp}`);
    title = `Home kurta ${stamp}`;
    await approvedProduct(
      people.vendor,
      people.moderator,
      title,
      [
        {
          sizeCode: sizes[0]?.code ?? '',
          colourCode: colours[0]?.code ?? '',
          pricePaise: 129900,
          stock: 4,
        },
      ],
      brand.id,
    );
  });

  test('the home page: the hero, the categories, the brands and New arrivals, newest first', async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);
    // The text-only hero with the approved lines, no button (Document 6, 12.4).
    await expect(async () => {
      await page.goto('/en');
      await expect(
        page.getByRole('region', { name: 'New arrivals' }).getByRole('link').first(),
      ).toContainText(title, { timeout: 2_000 });
    }).toPass(KEPT);
    await expect(
      page.getByRole('heading', { name: 'Browse new arrivals', level: 1 }),
    ).toBeVisible();
    await expect(page.getByText('Browse the newest listings.')).toBeVisible();
    await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);

    // Categories with products, as links to their pages.
    const categories = page.getByRole('region', { name: 'Shop by category' });
    await expect(categories.getByRole('link', { name: 'Kurtas' })).toHaveAttribute(
      'href',
      '/en/category/kurtas',
    );
    // The new brand, as a link to its page.
    await expect(
      page.getByRole('region', { name: 'Brands' }).getByRole('link', { name: brand.name }),
    ).toHaveAttribute('href', `/en/brand/${brand.slug}`);

    // New arrivals: four standard cards, no "View all" (D5-12).
    const arrivals = page.getByRole('region', { name: 'New arrivals' });
    await expect(arrivals.getByRole('listitem')).toHaveCount(4);
    await expect(arrivals.getByRole('link', { name: /view all/i })).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, follow/);
    await noAxeViolations(page);
  });

  test('on a phone the brands are not shown, as in the approved screens; the home page in Hindi', async ({
    page,
  }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/en');
    await expect(page.getByRole('region', { name: 'Shop by category' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Brands' })).toBeHidden();
    await page.goto('/hi');
    await expect(page.getByRole('heading', { name: 'नए उत्पाद देखें', level: 1 })).toBeVisible();
    await expect(page.getByRole('region', { name: 'श्रेणी के अनुसार' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'नए उत्पाद' })).toBeVisible();
    await noAxeViolations(page);
  });

  test('a brand page: its products, the filters without a brand group, and its own address', async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);
    // A brand made a moment ago may be unknown until our server's brand map is read again.
    await expect(async () => {
      const answer = await page.goto(`/en/brand/${brand.slug}`);
      expect(answer?.status()).toBe(200);
    }).toPass(KEPT);
    await expect(page.getByRole('heading', { name: brand.name, level: 1 })).toBeVisible();
    await expect(
      page.getByRole('main').getByText('1 product', { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
    const panel = page.getByRole('complementary', { name: 'Filters' });
    await expect(panel.getByRole('group', { name: 'Size' })).toBeVisible();
    await expect(panel.getByRole('group', { name: 'Brand' })).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/en/brand/${brand.slug}$`),
    );
    await noAxeViolations(page);

    // The sort works here too, and a sorted brand list is not indexed.
    await page.getByRole('combobox', { name: 'Sort' }).selectOption('price_asc');
    await expect(page).toHaveURL(new RegExp(`/en/brand/${brand.slug}\\?sort=price_asc$`));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

    // The Hindi page, and an unknown brand is a real 404.
    await page.goto(`/hi/brand/${brand.slug}`);
    await expect(page.getByRole('heading', { name: brand.name, level: 1 })).toBeVisible();
    expect((await page.goto('/en/brand/no-such-brand-anywhere'))?.status()).toBe(404);
  });

  test('our brand endpoint gives a page of the active brands', async ({ request }) => {
    const answer = await request.get('/api/catalogue/brands?page=1&limit=100');
    expect(answer.ok()).toBe(true);
    expect(answer.headers()['cache-control']).toBe('public, max-age=600');
    const body = (await answer.json()) as { items: { slug: string }[]; limit: number };
    expect(body.limit).toBe(100);
    expect(body.items.length).toBeGreaterThan(0);
  });
});
