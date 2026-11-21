import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog } from './support/login';
import { nextRequestBody } from './support/requests';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Slice 4a (Document 5, sections 7.5 and 8.2; Document 8, Slice 4 notes): the Vendor area menu, the
 * business profile and the one read-only banner. Each test makes a new vendor in the status it
 * needs. Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const NOT_APPROVED =
  'Your application has not been approved yet. You can read this page but not change it.';
const SUSPENDED = 'Your vendor account is suspended. You can read this page but not change it.';

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const sideMenu = (page: Page) =>
  page.locator('aside').getByRole('navigation', { name: 'Menu' }).getByRole('link');

test.describe('the business profile and the read-only banner', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(150_000);

  test('an approved vendor: the menu, the details (only what changed is sent), addresses and documents', async ({
    browser,
  }) => {
    const { page, shop, email } = await vendorIn(browser, MadeStatus.Approved);
    await page.setViewportSize(WIDE);
    await page.goto('/en/vendor/profile');
    await expect(page.getByRole('heading', { name: 'Business profile', level: 1 })).toBeVisible();
    await expect(sideMenu(page)).toHaveText(['Home', 'Business profile', 'Products', 'Stock']);
    await expect(sideMenu(page).nth(1)).toHaveAttribute('aria-current', 'page');
    // An approved vendor sees no read-only banner.
    await expect(page.getByText(NOT_APPROVED)).toHaveCount(0);

    // The details, read; only the shop name and email can change.
    const details = page.getByRole('region', { name: 'Details' });
    await expect(details.getByText(shop, { exact: true })).toBeVisible();
    await expect(details.getByText(email)).toBeVisible();
    await noAxeViolations(page);
    await details.getByRole('button', { name: 'Edit details' }).click();
    await expect(
      details.getByText('Your legal name, GSTIN and seller type cannot be changed after approval.'),
    ).toBeVisible();
    await details.getByLabel('Shop name').fill(`${shop} Studio`);
    const sent = nextRequestBody(page, 'PATCH', /^\/api\/vendors\/me$/);
    await details.getByRole('button', { name: 'Save changes' }).click();
    expect(await sent).toEqual({ displayName: `${shop} Studio` });
    await expect(
      page.getByRole('status').filter({ hasText: 'Your changes are saved' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Details' })).toBeFocused();
    await page.reload();
    await expect(details.getByText(`${shop} Studio`, { exact: true })).toBeVisible();

    // Addresses: add a return address, then remove it; the only pickup address must stay.
    const addresses = page.getByRole('region', { name: 'Pickup and return addresses' });
    await addresses.getByRole('button', { name: 'Add an address' }).click();
    await addresses.getByLabel('Address type').selectOption('return');
    await addresses.getByLabel('Address line 1').fill('7 Station Road');
    await addresses.getByLabel('City').fill('Jaipur');
    await addresses.getByLabel('State').fill('Rajasthan');
    await addresses.getByLabel('Pin code').fill('302006');
    await addresses.getByLabel('Contact phone').fill('9876543210');
    await addresses.getByRole('button', { name: 'Save address' }).click();
    await expect(addresses.getByText('7 Station Road, Jaipur, Rajasthan, 302006')).toBeVisible();
    const returnCard = addresses.getByRole('listitem').filter({ hasText: '7 Station Road' });
    await returnCard.getByRole('button', { name: 'Remove' }).click();
    await page
      .getByRole('alertdialog', { name: 'Remove this address?' })
      .getByRole('button', { name: 'Remove' })
      .click();
    await expect(addresses.getByText('7 Station Road')).toHaveCount(0);
    const pickupCard = addresses.getByRole('listitem').filter({ hasText: '12 MG Road' });
    await pickupCard.getByRole('button', { name: 'Remove' }).click();
    await page
      .getByRole('alertdialog', { name: 'Remove this address?' })
      .getByRole('button', { name: 'Remove' })
      .click();
    // The backend refuses; its answer shows in the card, and the address stays.
    await expect(
      pickupCard.getByText('The application cannot be changed in its current status.'),
    ).toBeVisible();
    await expect(pickupCard.getByText('12 MG Road, Jaipur, Rajasthan, 302001')).toBeVisible();

    // Documents: the approved PAN card can be replaced, not removed.
    const documents = page.getByRole('region', { name: 'Documents' });
    await expect(documents.getByText('Approved', { exact: true })).toBeVisible();
    await expect(documents.getByRole('button', { name: /^Replace\s*: PAN card$/ })).toBeVisible();
    await expect(documents.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
    await noAxeViolations(page);
  });

  test('a vendor waiting for review reads everything, changes nothing, and sees one banner', async ({
    browser,
  }) => {
    const { page, shop } = await vendorIn(browser, MadeStatus.Submitted);
    await page.setViewportSize(WIDE);
    await page.goto('/en/vendor/profile');
    await expect(page.getByText(NOT_APPROVED)).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'See your application' })).toHaveAttribute(
      'href',
      '/en/vendor/apply',
    );
    await expect(page.getByText(shop, { exact: true })).toBeVisible();
    await expect(page.getByText('12 MG Road, Jaipur, Rajasthan, 302001')).toBeVisible();
    await expect(page.getByText('Pending review')).toBeVisible();
    // No change buttons.
    await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);
    await noAxeViolations(page);

    // The products list: the same one banner, and no "Add product".
    await page.goto('/en/vendor/products');
    await expect(page.getByText(NOT_APPROVED)).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Add product' })).toHaveCount(0);

    // The application page has its own status card, not the banner.
    await page.goto('/en/vendor/apply');
    await expect(page.getByText('Waiting for review')).toBeVisible();
    await expect(page.getByText(NOT_APPROVED)).toHaveCount(0);

    // In Hindi.
    await page.goto('/hi/vendor/profile');
    await expect(page.getByRole('heading', { name: 'व्यवसाय प्रोफ़ाइल', level: 1 })).toBeVisible();
    await expect(
      page.getByText(
        'आपका आवेदन अभी स्वीकृत नहीं हुआ है। आप यह पेज पढ़ सकते हैं, पर बदल नहीं सकते।',
      ),
    ).toBeVisible();
    await noAxeViolations(page);
  });

  test('a suspended vendor sees the suspended banner and no change buttons', async ({
    browser,
  }) => {
    const { page } = await vendorIn(browser, MadeStatus.Suspended);
    await page.setViewportSize(WIDE);
    await page.goto('/en/vendor/profile');
    await expect(page.getByText(SUSPENDED)).toBeVisible();
    await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);
    await page.goto('/en/vendor/products');
    await expect(page.getByText(SUSPENDED)).toHaveCount(1);
    await noAxeViolations(page);
  });
});
