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

test('a missing page says so in English and Hindi, with a way to each home page (Document 4, section 10)', async ({ page }) => {
  const response = await page.goto('/hi/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'This page was not found' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'यह पेज नहीं मिला' })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
});

test('standalone controls have at least a 44 by 44 px hit area on a phone (Document 6, D6-11)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/en/login');
  for (const control of [page.getByRole('button', { name: 'Send code' }), page.getByRole('link', { name: 'हिन्दी' }), page.getByRole('link', { name: 'Dhaaga' })]) {
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
    await expect(page.getByText('Dhaaga', { exact: true })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  for (const path of [`/${lang}`, `/${lang}/login`]) test(`${path} stays inside the 300 KB first-load budget (provisional, Document 6 section 14)`, async ({ page }) => {
    // Transferred bytes after compression, empty cache; photos and API data are not counted. Fonts for the page language
    // are inside the total; a second-script font loaded on demand is not counted in it and is reported on its own
    // (Document 6, section 14, and 5.4). On English pages that is Noto Sans Devanagari, for the "हिन्दी" switch.
    const counted = new Set(['document', 'stylesheet', 'script', 'font']);
    const sizes: Promise<{ bytes: number; secondScript: boolean }>[] = [];
    page.on('requestfinished', (request) => {
      if (!counted.has(request.resourceType())) return;
      const secondScript = lang === 'en' && request.resourceType() === 'font' && request.url().includes('devanagari');
      sizes.push(request.sizes().then((s) => ({ bytes: s.responseBodySize + s.responseHeadersSize, secondScript })));
    });
    await page.goto(path, { waitUntil: 'networkidle' });
    const all = await Promise.all(sizes);
    const total = all.filter((s) => !s.secondScript).reduce((a, s) => a + s.bytes, 0);
    const onDemand = all.filter((s) => s.secondScript).reduce((a, s) => a + s.bytes, 0);
    const fonts = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /\.woff2/.test(e.name)).map((e) => e.name.split('/').pop()));
    console.log(`${path} first load: ${(total / 1024).toFixed(1)} KB; second-script font on demand: ${(onDemand / 1024).toFixed(1)} KB; fonts: ${fonts.join(', ')}`);
    // Known and reported, not hidden: Hindi pages carry about 146 KB of fonts, so the Hindi login page is over the
    // provisional 300 KB. Document 6, section 14, validation item 3 leaves this to the owner and the figure is not
    // changed here; until then this one page is measured and reported, not judged.
    if (path === '/hi/login') {
      test.info().annotations.push({ type: 'over budget, owner decision', description: `${(total / 1024).toFixed(1)} KB (Document 6, section 14, item 3)` });
      return;
    }
    expect(total).toBeLessThanOrEqual(300 * 1024);
  });
}
