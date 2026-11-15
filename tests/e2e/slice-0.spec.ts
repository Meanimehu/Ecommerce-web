import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { countFirstLoad, expectWithinBudget } from './support/page-size';

/** Slice 0: the blank pages, the language redirect, the health check, accessibility and the first-load page-size budget. */

test('a visit with no prefix goes to the browser language, and the redirect is never shared-cached', async ({
  request,
}) => {
  const hindi = await request.get('/', {
    maxRedirects: 0,
    headers: { 'accept-language': 'hi-IN,hi;q=0.9,en;q=0.8' },
  });
  expect(hindi.status()).toBe(307);
  expect(hindi.headers().location).toBe('/hi');
  expect(hindi.headers()['cache-control']).toContain('no-store');

  const other = await request.get('/', {
    maxRedirects: 0,
    headers: { 'accept-language': 'fr-FR,fr;q=0.9' },
  });
  expect(other.headers().location).toBe('/en');
});

test('only /en and /hi exist; anything else is a real 404', async ({ request }) => {
  expect((await request.get('/en/does-not-exist')).status()).toBe(404);
  expect((await request.get('/fr')).status()).toBe(404);
});

test('a missing page says so in English and Hindi, with a way to each home page (Document 4, section 10)', async ({
  page,
}) => {
  const response = await page.goto('/hi/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'This page was not found' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'यह पेज नहीं मिला' })).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('standalone controls have at least a 44 by 44 px hit area on a phone (Document 6, D6-11)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/en/login');
  // On a phone the language switch is in the menu and in the footer (Document 6, 7.3).
  for (const control of [
    page.getByRole('button', { name: 'Send code' }),
    page.getByRole('contentinfo').getByRole('link', { name: 'हिन्दी' }),
    page.getByRole('banner').getByRole('link', { name: 'Dhaaga' }),
    page.getByRole('banner').locator('summary', { hasText: 'Menu' }),
  ]) {
    const box = await control.boundingBox();
    expect(box?.height, await control.innerText()).toBeGreaterThanOrEqual(44);
    expect(box?.width, await control.innerText()).toBeGreaterThanOrEqual(44);
  }
});

test('the health check answers and is never cached', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(await response.json()).toEqual({ status: 'ok' });
});

for (const lang of ['en', 'hi'] as const) {
  test(`/${lang} renders in its language with no accessibility violations`, async ({ page }) => {
    await page.goto(`/${lang}`);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('banner').getByText('Dhaaga', { exact: true })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  for (const path of [`/${lang}`, `/${lang}/login`])
    test(`${path} stays inside the first-load budget (Document 6, section 14)`, async ({
      page,
    }) => {
      const firstLoad = countFirstLoad(page, lang);
      await page.goto(path, { waitUntil: 'networkidle' });
      expectWithinBudget(path, lang, await firstLoad());
    });
}
