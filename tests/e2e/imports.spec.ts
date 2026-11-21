import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { backendLog } from './support/login';
import { countFirstLoad, reportFirstLoad } from './support/page-size';
import { backend, twoSizesAndColours } from './support/products';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Held item H1 (Document 5, sections 7.3 and 11; area-3b-products.md, section 7): CSV product
 * import. The example file and its columns, an upload that only checks the file (each problem by its
 * line and column, "nothing has been created"), the confirm that creates each ready product as a
 * draft and shows each product's result, a lost confirm answer (the import is read again and nothing
 * is sent again), a file the backend cannot read, and a vendor that is not approved. Each test makes
 * its own vendor, so SKUs never clash. Against the real local backend; skipped where it is not
 * running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const CONFIRM_PATH = /^\/api\/vendors\/me\/imports\/[^/]+\/confirm$/;

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const toast = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });

/**
 * A file with one ready product (two sizes, lines 2 and 3) and one with problems (line 4: an
 * unknown size, and a price above the MRP). Returns the file and the ready product's title.
 */
async function mixedFile(vendor: Page) {
  const { sizes, colours } = await twoSizesAndColours(vendor);
  const stamp = String(Date.now()).slice(-7);
  const colour = colours[0]?.code ?? '';
  const readyTitle = `Imported dupatta ${stamp}`;
  const lines = [
    'product_ref,title,category_slug,sku,size_code,colour_code,price_rupees,mrp_rupees',
    `GOOD-1,${readyTitle},kurtas,IM${stamp}-1,${sizes[0]?.code},${colour},499,799`,
    `GOOD-1,,,IM${stamp}-2,${sizes[1]?.code},${colour},549.50,799`,
    `BAD-1,Imported kurta ${stamp},kurtas,IM${stamp}-3,XX,${colour},999,799`,
  ];
  return {
    file: {
      name: `mixed-${stamp}.csv`,
      mimeType: 'text/csv',
      buffer: Buffer.from(lines.join('\n')),
    },
    readyTitle,
  };
}

async function chooseFile(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose a CSV file' }).click();
  await (await chooser).setFiles(file);
}

test.describe('CSV import', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('the example file, an upload checked row by row, and a confirm with each product’s result', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Approved);
    await page.setViewportSize(WIDE);

    // Reached from the Products page; the menu still marks Products.
    await page.goto('/en/vendor/products');
    await page.getByRole('link', { name: 'Import from a CSV file' }).click();
    await expect(page).toHaveURL(/\/en\/vendor\/imports$/);
    await expect(
      page.getByRole('heading', { name: 'Import products from a CSV file', level: 1 }),
    ).toBeVisible();
    await expect(page.locator('aside').getByRole('link', { name: 'Products' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByText('No imports yet')).toBeVisible();
    await expect(page.getByText(/At most 1000 rows and 2\.0 MB per file/)).toBeVisible();
    await noAxeViolations(page);

    // The example file, through our server: with no category, then for Kurtas.
    let download = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download the example file' }).click();
    expect((await download).suggestedFilename()).toMatch(/\.csv$/);
    const general = await (await download).path();
    expect(readFileSync(general, 'utf8')).toContain('product_ref,title');
    await page.getByLabel('Category for the example').selectOption({ label: 'Women › Kurtas' });
    download = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download the example file' }).click();
    expect((await download).suggestedFilename()).toBe('product-import-template-kurtas.csv');

    // The columns of the file, as the backend lists them.
    await page.locator('summary').filter({ hasText: 'Columns of the file' }).click();
    await expect(page.getByRole('cell', { name: 'product_ref' })).toBeVisible();
    await noAxeViolations(page);

    // Upload: the file is only checked, and its import opens.
    const { file, readyTitle } = await mixedFile(page);
    const uploaded = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/vendors/me/imports' &&
        response.request().method() === 'POST',
    );
    await chooseFile(page, file);
    expect((await uploaded).status()).toBe(201);
    await expect(page).toHaveURL(/\/en\/vendor\/imports\/[^/]+$/);
    const importUrl = page.url();
    await expect(page.getByRole('heading', { name: file.name, level: 1 })).toBeVisible();
    await expect(
      page.getByText('Nothing has been created yet. 1 of 2 products are ready.'),
    ).toBeVisible();
    const products = page.getByRole('table', { name: 'Products in the file' });
    await expect(products.getByRole('row').filter({ hasText: 'GOOD-1' })).toContainText('Ready');
    await expect(products.getByRole('row').filter({ hasText: 'GOOD-1' })).toContainText('2, 3');
    await expect(products.getByRole('row').filter({ hasText: 'BAD-1' })).toContainText(
      'Has problems',
    );
    const problemRow = page
      .getByRole('table', { name: 'Rows with problems' })
      .getByRole('row')
      .filter({ hasText: 'Line 4' });
    await expect(problemRow).toContainText('size_code');
    await expect(problemRow).toContainText('price_rupees');
    await noAxeViolations(page);

    // Nothing exists yet.
    let mine = (await backend(
      page,
      'GET',
      `/vendors/me/products?q=${encodeURIComponent(readyTitle)}`,
    )) as {
      total: number;
    };
    expect(mine.total).toBe(0);

    // Confirm: one press, with no body; the ready product is created as a draft, the other is not.
    const confirmed = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && CONFIRM_PATH.test(new URL(request.url()).pathname),
    );
    await page.getByRole('button', { name: 'Create 1 product as a draft' }).click();
    expect((await confirmed).postDataJSON()).toEqual({});
    await expect(toast(page, 'Import confirmed.')).toBeVisible();
    await expect(page.getByText(/1 of 2 products were created as drafts/)).toBeVisible();
    await expect(products.getByRole('row').filter({ hasText: 'GOOD-1' })).toContainText(
      '2 variants',
    );
    await expect(products.getByRole('row').filter({ hasText: 'BAD-1' })).toContainText(
      'Not created',
    );
    await expect(page.getByRole('button', { name: /as a draft/ })).toHaveCount(0);
    mine = (await backend(
      page,
      'GET',
      `/vendors/me/products?q=${encodeURIComponent(readyTitle)}`,
    )) as {
      total: number;
    };
    expect(mine.total).toBe(1);

    // After a reload the result is the backend's; the draft opens from it.
    await page.goto(importUrl);
    await expect(page.getByText(/1 of 2 products were created as drafts/)).toBeVisible();
    await page.getByRole('link', { name: new RegExp(`^Open the draft.*${readyTitle}$`) }).click();
    await expect(page.getByRole('heading', { name: readyTitle })).toBeVisible();

    // The imports list shows it confirmed.
    await page.goto('/en/vendor/imports');
    const listed = page.getByRole('row').filter({ hasText: file.name });
    await expect(listed).toContainText('Confirmed');
    await expect(listed).toContainText('1 of 2');
  });

  test('a lost confirm answer: the import is read again and nothing is sent again', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Approved);
    await page.setViewportSize(WIDE);
    await page.goto('/en/vendor/imports');
    const { file } = await mixedFile(page);
    await chooseFile(page, file);
    await expect(page.getByRole('button', { name: 'Create 1 product as a draft' })).toBeVisible();

    // The confirm reaches the backend, but its answer never comes back to the browser.
    let confirms = 0;
    await page.route('**/api/vendors/me/imports/*/confirm', async (route) => {
      confirms += 1;
      await route.fetch();
      await route.abort('connectionfailed');
    });
    await page.getByRole('button', { name: 'Create 1 product as a draft' }).click();
    await expect(
      page.getByText(/We could not tell whether the products were created/),
    ).toBeVisible();
    await expect(page.getByText(/1 of 2 products were created as drafts/)).toBeVisible();
    await expect(page.getByRole('button', { name: /as a draft/ })).toHaveCount(0);
    await page.waitForTimeout(1500);
    expect(confirms).toBe(1);
    await noAxeViolations(page);
  });

  test('a file the backend cannot read, and one too large to send', async ({ browser }) => {
    const { page } = await vendorIn(browser, MadeStatus.Approved);
    await page.goto('/en/vendor/imports');

    await chooseFile(page, {
      name: 'wrong.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('foo,bar\n1,2\n'),
    });
    await expect(page.getByText(/This file cannot be used/)).toBeVisible();
    await expect(page.getByText('What is wrong with the file:')).toBeVisible();
    await expect(page.getByText('unknown column "foo"')).toBeVisible();
    await expect(page).toHaveURL(/\/en\/vendor\/imports$/);
    await noAxeViolations(page);

    let sent = false;
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/api/vendors/me/imports'))
        sent = true;
    });
    await chooseFile(page, {
      name: 'big.csv',
      mimeType: 'text/csv',
      buffer: Buffer.alloc(3 * 1024 * 1024, 'a'),
    });
    await expect(page.getByText('This file is too large. Choose a smaller file.')).toBeVisible();
    expect(sent).toBe(false);
  });

  test('a vendor that is not approved gets the example file but cannot upload; and in Hindi', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Submitted);
    await page.goto('/en/vendor/products');
    await expect(page.getByRole('link', { name: 'Import from a CSV file' })).toBeVisible();
    await page.goto('/en/vendor/imports');
    await expect(page.getByRole('link', { name: 'Download the example file' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose a CSV file' })).toHaveCount(0);
    await expect(page.getByText('No imports yet')).toBeVisible();

    await page.goto('/hi/vendor/imports');
    await expect(
      page.getByRole('heading', { name: 'CSV फ़ाइल से प्रोडक्ट इंपोर्ट करें', level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'उदाहरण फ़ाइल डाउनलोड करें' })).toBeVisible();
    await noAxeViolations(page);
  });

  test('page size of the imports page (staff pages are reported, not limited)', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Approved);
    const session = await page.context().storageState();
    for (const lang of ['en', 'hi'] as const) {
      const context = await browser.newContext({
        storageState: session,
        ignoreHTTPSErrors: true,
        baseURL: test.info().project.use.baseURL,
      });
      const fresh = await context.newPage();
      const firstLoad = countFirstLoad(fresh, lang);
      await fresh.goto(`/${lang}/vendor/imports`, { waitUntil: 'networkidle' });
      reportFirstLoad(`/${lang}/vendor/imports`, await firstLoad());
      await context.close();
    }
  });
});
