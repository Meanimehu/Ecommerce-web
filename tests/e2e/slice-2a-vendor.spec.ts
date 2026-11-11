import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog, freshPhone, pageAs } from './support/login';
import { TEST_PDF } from './support/files';

/**
 * Slice 2a (Document 8, Slice 2): a new account applies to become a vendor, an admin reviews the documents and approves
 * the vendor. Against the real local backend; skipped where it is not running.
 */
const ADMIN_PHONE = process.env.E2E_ADMIN_PHONE ?? '9000000001';
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

test.describe('become a vendor, and admin review', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(120_000);

  test('a person with no vendor is sent to the application, applies, and an admin approves', async ({ browser }) => {
    const phone = freshPhone();
    const shop = `Test Weaves ${phone.slice(-4)}`;

    // The Vendor area needs a vendor; the application page is open to anyone logged in (Document 5, section 4).
    const page = await pageAs(browser, phone, '/en/vendor');
    await expect(page).toHaveURL(/\/en\/vendor\/apply$/);
    await expect(page.getByRole('heading', { name: 'Become a vendor', level: 1 })).toBeVisible();
    await expect(page.getByText('You have not started an application yet.')).toBeVisible();
    await noAxeViolations(page);

    // Step 1: a missing value shows under its field and in the summary.
    await page.getByRole('link', { name: 'Start your application' }).click();
    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /Fix \d things to continue/ })).toBeFocused();
    await expect(page.getByLabel('Legal name')).toHaveAttribute('aria-invalid', 'true');
    await page.getByLabel('Seller type').selectOption('proprietorship');
    await page.getByLabel('Legal name').fill(`${shop} Proprietorship`);
    await page.getByLabel('Shop name').fill(shop);
    await page.getByLabel('Contact email').fill(`owner${phone.slice(-4)}@example.com`);
    await noAxeViolations(page);
    await page.getByRole('button', { name: 'Save and continue' }).click();

    // Step 2: a pickup address. The backend checks the pin code and the phone.
    await expect(page).toHaveURL(/step=address/);
    await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
    await page.getByLabel('Address line 1').fill('12 MG Road');
    await page.getByLabel('City').fill('Jaipur');
    await page.getByLabel('State').fill('Rajasthan');
    await page.getByLabel('Pin code').fill('302001');
    await page.getByLabel('Contact phone').fill(phone);
    await page.getByRole('button', { name: 'Save address' }).click();
    await expect(page.getByText('12 MG Road, Jaipur, Rajasthan, 302001')).toBeVisible();
    await noAxeViolations(page);
    await page.getByRole('link', { name: 'Continue' }).click();

    // Step 3: the PAN card, uploaded through our server with progress; the backend reads the real file type.
    await expect(page).toHaveURL(/step=documents/);
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /^Add file\s*: PAN card$/ }).click();
    await (await chooser).setFiles({ name: 'pan.pdf', mimeType: 'application/pdf', buffer: TEST_PDF });
    await expect(page.getByText(/^pan\.pdf · /)).toBeVisible();
    await expect(page.getByText('Pending review')).toBeVisible();
    // The person's own file opens through our server, never from storage directly (D3-04).
    const file = await page.request.get(await page.getByRole('link', { name: /^View\s*: pan\.pdf$/ }).getAttribute('href') ?? '');
    expect(file.status()).toBe(200);
    expect(file.headers()['content-type']).toBe('application/pdf');
    await noAxeViolations(page);
    await page.getByRole('link', { name: 'Continue' }).click();

    // Step 4: nothing is missing; Submit needs the terms box ticked. The terms are a marked demo (Q8-4).
    await expect(page.getByText('Everything needed is here.')).toBeVisible();
    await expect(page.getByText('Demo text — not the real vendor terms')).toBeVisible();
    const submit = page.getByRole('button', { name: 'Submit application' });
    await expect(submit).toBeDisabled();
    await page.getByLabel('I have read and agree to the vendor terms').check();
    await noAxeViolations(page);
    await submit.click();
    await expect(page).toHaveURL(/\/en\/vendor\/apply$/);
    await expect(page.getByText('We have your application. It is read-only while it is reviewed.')).toBeVisible();
    await expect(page.getByText('Waiting for review')).toBeVisible();

    // The admin opens it from the list, approves the document, then the vendor.
    const admin = await pageAs(browser, ADMIN_PHONE, '/en/admin/vendors?status=submitted');
    await expect(admin.getByRole('heading', { name: 'Vendor review', level: 1 })).toBeVisible();
    await noAxeViolations(admin);
    await admin.getByRole('link', { name: shop }).first().click();
    await expect(admin.getByRole('heading', { name: shop, level: 1 })).toBeVisible();
    await noAxeViolations(admin);

    // Approving the vendor before the document: the backend lists what is lacking, and the screen shows it.
    await admin.getByRole('button', { name: 'Approve vendor' }).click();
    await expect(admin.getByRole('alert').filter({ hasText: 'This vendor cannot be approved yet' })).toContainText('PAN card');

    await admin.getByRole('button', { name: /^Approve\s*: PAN card$/ }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Document approved' })).toBeVisible();
    await admin.getByRole('button', { name: 'Approve vendor' }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Vendor approved' })).toBeVisible();
    await expect(admin.getByText('Approved', { exact: true }).filter({ visible: true }).first()).toBeVisible();

    // The new vendor now reaches the Vendor area, and the application shows Approved.
    await page.goto('/en/vendor/apply');
    await expect(page.getByText('Your application is approved. You can start adding products.')).toBeVisible();
    await page.getByRole('link', { name: 'Go to vendor home' }).click();
    await expect(page).toHaveURL(/\/en\/vendor$/);
  });

  test('a rejected application shows the reason and can be edited and sent again', async ({ browser }) => {
    const phone = freshPhone();
    const shop = `Reject Test ${phone.slice(-4)}`;
    const page = await pageAs(browser, phone, '/hi/vendor/apply');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await page.getByRole('link', { name: 'आवेदन शुरू करें' }).click();
    await page.getByLabel('विक्रेता का प्रकार').selectOption('individual');
    await page.getByLabel('कानूनी नाम').fill(shop);
    await page.getByLabel('दुकान का नाम').fill(shop);
    await page.getByLabel('संपर्क ईमेल').fill(`r${phone.slice(-4)}@example.com`);
    await page.getByRole('button', { name: 'सहेजें और आगे बढ़ें' }).click();
    await expect(page).toHaveURL(/step=address/);
    await page.getByLabel('पता पंक्ति 1').fill('4 Station Road');
    await page.getByLabel('शहर').fill('Pune');
    await page.getByLabel('राज्य').fill('Maharashtra');
    await page.getByLabel('पिन कोड').fill('411001');
    await page.getByLabel('संपर्क फ़ोन').fill(phone);
    await page.getByRole('button', { name: 'पता सहेजें' }).click();
    await expect(page.getByText('4 Station Road, Pune, Maharashtra, 411001')).toBeVisible();
    await noAxeViolations(page);
    await page.goto('/hi/vendor/apply?step=documents');
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /^फ़ाइल जोड़ें\s*: PAN कार्ड$/ }).click();
    await (await chooser).setFiles({ name: 'pan.pdf', mimeType: 'application/pdf', buffer: TEST_PDF });
    await expect(page.getByText(/^pan\.pdf · /)).toBeVisible();
    await page.goto('/hi/vendor/apply?step=review');
    await page.getByLabel('मैंने विक्रेता की शर्तें पढ़ ली हैं और मैं उनसे सहमत हूँ').check();
    await page.getByRole('button', { name: 'आवेदन जमा करें' }).click();
    await expect(page).toHaveURL(/\/hi\/vendor\/apply$/);

    const admin = await pageAs(browser, ADMIN_PHONE, '/en/admin/vendors?status=submitted');
    await admin.getByRole('link', { name: shop }).first().click();
    await admin.getByRole('button', { name: 'Reject', exact: true }).click();
    const dialog = admin.getByRole('alertdialog');
    await dialog.getByRole('button', { name: 'Reject application' }).click();
    // A missing reason is caught before sending, under the field.
    await expect(dialog.getByLabel('Reason (the vendor can read it)')).toHaveAttribute('aria-invalid', 'true');
    await dialog.getByLabel('Reason (the vendor can read it)').fill('The PAN card is not readable.');
    await dialog.getByRole('button', { name: 'Reject application' }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Application rejected' })).toBeVisible();

    await page.goto('/hi/vendor/apply');
    await expect(page.getByText('The PAN card is not readable.')).toBeVisible();
    await page.getByRole('link', { name: 'सुधारें और फिर जमा करें' }).click();
    await expect(page).toHaveURL(/step=details/);
    await noAxeViolations(page);
  });

  test('a customer gets a real 403 on the admin vendor screens, and a file over the limit is refused before it is sent', async ({ browser }) => {
    const phone = freshPhone();
    const page = await pageAs(browser, phone, '/en/account');
    await expect(page.getByRole('link', { name: 'Become a vendor' })).toBeVisible();
    const response = await page.goto('/en/admin/vendors');
    expect(response?.status()).toBe(403);

    await page.goto('/en/vendor/apply?step=details');
    await page.getByLabel('Seller type').selectOption('individual');
    await page.getByLabel('Legal name').fill('Size Test');
    await page.getByLabel('Shop name').fill('Size Test');
    await page.getByLabel('Contact email').fill(`s${phone.slice(-4)}@example.com`);
    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(page).toHaveURL(/step=address/);
    await page.goto('/en/vendor/apply?step=documents');
    let uploads = 0;
    page.on('request', (request) => {
      if (request.url().endsWith('/api/vendors/me/documents') && request.method() === 'POST') uploads += 1;
    });
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /^Add file\s*: PAN card$/ }).click();
    await (await chooser).setFiles({ name: 'big.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 32) });
    await expect(page.getByRole('alert').filter({ hasText: 'This file is too large. Choose a smaller file.' })).toBeVisible();
    expect(uploads).toBe(0);

    // Our upload endpoint refuses a request from another site before reading it (Document 7, section 17.3).
    const foreign = await page.request.post('/api/vendors/me/documents', { headers: { origin: 'https://evil.example', 'x-dhaaga-csrf': '1' }, multipart: { type: 'pan', file: { name: 'pan.pdf', mimeType: 'application/pdf', buffer: TEST_PDF } } });
    expect(foreign.status()).toBe(403);
  });
});
