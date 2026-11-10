import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Slice 0: the blank pages, the language redirect, the health check, accessibility and the first-load size budget. */

test('a visit with no prefix goes to the browser language, and the redirect is never shared-cached', async ({ request }) => {
  const hindi = await request.get('/', { maxRedirects: 0, headers: { 'accept-language': 'hi-IN,hi;q=0.9,en;q=0.8' } });
  expect(hindi.status()).toBe(307);
  expect(hindi.headers().location).toBe('/hi');
  expect(hindi.headers()['cache-control']).toContain('no-store');

  const other = await request.get('/', { maxRedirects: 0, headers: { 'accept-language': 'fr-FR,fr;q=0.9' } });
  expect(other.headers().location).toBe('/en');
});

test('only /en and /hi exist; anything else is a real 404', async ({ request }) => {
  expect((await request.get('/en/does-not-exist')).status()).toBe(404);
  expect((await request.get('/fr')).status()).toBe(404);
});

test('the health check answers and is never cached', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe('no-store');
  const body = (await response.json()) as { status: string; store: { ok: boolean } };
  expect(body.status).toBe('ok');
  expect(typeof body.store.ok).toBe('boolean');
});

for (const lang of ['en', 'hi'] as const) {
  test(`/${lang} renders in its language with no accessibility violations`, async ({ page }) => {
    await page.goto(`/${lang}`);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByText('Dhaaga', { exact: true })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  for (const path of [`/${lang}`, `/${lang}/login`]) test(`${path} stays inside the 300 KB first-load budget (provisional, Document 6 section 14)`, async ({ page }) => {
    // Transferred bytes after compression, empty cache; photos and API data are not counted (Document 6, section 14).
    const counted = new Set(['document', 'stylesheet', 'script', 'font']);
    const sizes: Promise<number>[] = [];
    page.on('requestfinished', (request) => {
      if (!counted.has(request.resourceType())) return;
      sizes.push(request.sizes().then((s) => s.responseBodySize + s.responseHeadersSize));
    });
    await page.goto(path, { waitUntil: 'networkidle' });
    const total = (await Promise.all(sizes)).reduce((a, b) => a + b, 0);
    console.log(`${path} first load: ${(total / 1024).toFixed(1)} KB`);
    expect(total).toBeLessThanOrEqual(300 * 1024);
  });
}
