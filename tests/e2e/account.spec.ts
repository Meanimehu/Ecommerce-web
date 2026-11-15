import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog, freshPhone, pageAs } from './support/login';
import { backend } from './support/products';
import { nextRequestBody } from './support/requests';

/**
 * The account (Document 5, sections 6.5 and 8.1; approved Stage 5 screens): the Profile,
 * Addresses and Security tabs; the name and email, sending only what changed; saved addresses
 * added, changed, made default and deleted, up to 10; and the areas the person may enter. Each test
 * logs in a new customer. Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

/** Fills the address form that is open on the page. */
async function fillAddress(
  page: Page,
  address: { label?: string; name: string; phone: string; line1: string; pincode: string },
) {
  const form = page.locator('form').filter({ has: page.getByLabel('Address line 1') });
  if (address.label) await form.getByLabel('Label').fill(address.label);
  await form.getByLabel('Name').fill(address.name);
  await form.getByLabel('Mobile number').fill(address.phone);
  await form.getByLabel('Address line 1').fill(address.line1);
  await form.getByLabel('City').fill('Jaipur');
  await form.getByLabel('State').fill('Rajasthan');
  await form.getByLabel('Pin code').fill(address.pincode);
  return form;
}

test.describe('the account', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(120_000);

  test('the profile: the phone shown, name and email saved, only what changed is sent', async ({
    browser,
  }) => {
    const phone = freshPhone();
    const page = await pageAs(browser, phone, '/en/account');
    await page.setViewportSize(WIDE);
    const tabs = page.getByRole('navigation', { name: 'Account pages' });
    await expect(tabs.getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByText('The mobile number cannot be changed here.')).toBeVisible();
    await expect(page.getByText(phone.slice(-4))).toBeVisible();
    // A customer with no vendor is offered "Become a vendor" (D5-10).
    await expect(page.getByRole('link', { name: 'Become a vendor' })).toHaveAttribute(
      'href',
      '/en/vendor/apply',
    );
    await noAxeViolations(page);

    // A plainly wrong email is caught before sending.
    await page.getByLabel('Email').fill('asha@example');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(
      page.getByText('Enter an email address like name@example.com.').first(),
    ).toBeVisible();

    const email = `asha${Date.now()}@example.com`;
    await page.getByLabel('Name').fill('Asha Rao');
    await page.getByLabel('Email').fill(email);
    let sent = nextRequestBody(page, 'PATCH', /^\/api\/me$/);
    await page.getByRole('button', { name: 'Save changes' }).click();
    expect(await sent).toEqual({ name: 'Asha Rao', email });
    await expect(page.getByText('Your changes are saved')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Name')).toHaveValue('Asha Rao');
    await expect(page.getByLabel('Email')).toHaveValue(email);

    // Only the name changes now.
    await page.getByLabel('Name').fill('Asha R.');
    sent = nextRequestBody(page, 'PATCH', /^\/api\/me$/);
    await page.getByRole('button', { name: 'Save changes' }).click();
    expect(await sent).toEqual({ name: 'Asha R.' });
    await expect(page.getByText('Your changes are saved')).toBeVisible();

    // Another account cannot take the same email: the backend's answer shows by the field.
    const other = await pageAs(browser, freshPhone(), '/en/account');
    await other.getByLabel('Email').fill(email);
    await other.getByRole('button', { name: 'Save changes' }).click();
    await expect(other.getByText('Another account uses this email address.').first()).toBeVisible();
  });

  test('saved addresses: add, change only what changed, make default, delete, kept after a reload', async ({
    browser,
  }) => {
    const page = await pageAs(browser, freshPhone(), '/en/account/addresses');
    await page.setViewportSize(WIDE);
    await expect(page.getByText('No saved addresses yet')).toBeVisible();

    // A pin code that is not six digits is caught before sending.
    await page.getByRole('button', { name: 'Add a new address' }).click();
    let form = await fillAddress(page, {
      label: 'Home',
      name: 'Meera Nair',
      phone: '9444444444',
      line1: '12 Park Street',
      pincode: '7000',
    });
    await form.getByRole('button', { name: 'Save address' }).click();
    await expect(page.getByText('Enter a 6-digit pin code.').first()).toBeVisible();
    await form.getByLabel('Pin code').fill('700016');
    let sent = nextRequestBody(page, 'POST', /^\/api\/me\/addresses$/);
    await form.getByRole('button', { name: 'Save address' }).click();
    expect(await sent).toEqual({
      label: 'Home',
      name: 'Meera Nair',
      phone: '9444444444',
      line1: '12 Park Street',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '700016',
    });
    const home = page.getByRole('article', { name: 'Home' });
    await expect(home).toBeVisible();
    // The first address is the default.
    await expect(home.getByText('Default', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Saved addresses' })).toBeFocused();

    // A second one, with no label and no second line.
    await page.getByRole('button', { name: 'Add a new address' }).click();
    form = await fillAddress(page, {
      label: 'Office',
      name: 'Meera Nair',
      phone: '9444444444',
      line1: '5 Salt Lake Sector V',
      pincode: '700091',
    });
    await form.getByRole('button', { name: 'Save address' }).click();
    const office = page.getByRole('article', { name: 'Office' });
    await expect(office).toBeVisible();
    await noAxeViolations(page);

    // Changing the office's pin code sends only the pin code.
    await office.getByRole('button', { name: 'Edit' }).click();
    form = page.locator('form').filter({ has: page.getByLabel('Address line 1') });
    await form.getByLabel('Pin code').fill('700092');
    sent = nextRequestBody(page, 'PATCH', /^\/api\/me\/addresses\/[^/]+$/);
    await form.getByRole('button', { name: 'Save address' }).click();
    expect(await sent).toEqual({ pincode: '700092' });
    await expect(office.getByText(/700092/)).toBeVisible();

    // The office becomes the default, and comes first after a reload.
    await office.getByRole('button', { name: 'Make default' }).click();
    await expect(page.getByText('Default address changed')).toBeVisible();
    await page.reload();
    const cards = page.getByRole('article');
    await expect(cards.first()).toHaveAccessibleName('Office');
    await expect(
      page.getByRole('article', { name: 'Office' }).getByText('Default', { exact: true }),
    ).toBeVisible();

    // Deleting asks first.
    await page
      .getByRole('article', { name: 'Home' })
      .getByRole('button', { name: 'Delete' })
      .click();
    const confirm = page.getByRole('alertdialog', { name: 'Delete this address?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Address deleted')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('article')).toHaveCount(1);
  });

  test('at most 10 addresses: then "Add" gives way to a note', async ({ browser }) => {
    const page = await pageAs(browser, freshPhone(), '/en/account/addresses');
    for (let count = 1; count <= 10; count += 1) {
      await backend(page, 'POST', '/me/addresses', {
        label: `Place ${count}`,
        name: 'Ravi Kumar',
        phone: '9555555555',
        line1: `${count} MG Road`,
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      });
    }
    await page.reload();
    await expect(page.getByRole('article')).toHaveCount(10);
    await expect(page.getByRole('button', { name: 'Add a new address' })).toHaveCount(0);
    await expect(
      page.getByText('You have 10 addresses, the most you can keep. Delete one to add another.'),
    ).toBeVisible();
  });

  test('the security tab, the account in Hindi, and a person not logged in is sent to log in', async ({
    browser,
  }) => {
    const page = await pageAs(browser, freshPhone(), '/en/account/security');
    await expect(
      page
        .getByRole('navigation', { name: 'Account pages' })
        .getByRole('link', { name: 'Security' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out everywhere' })).toBeVisible();
    await noAxeViolations(page);

    await page.goto('/hi/account/addresses');
    await expect(page.getByRole('heading', { name: 'आपका खाता', level: 1 })).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'खाते के पेज' }).getByRole('link', { name: 'पते' }),
    ).toHaveAttribute('aria-current', 'page');
    await noAxeViolations(page);

    const visitor = await browser.newPage({
      baseURL: test.info().project.use.baseURL,
      ignoreHTTPSErrors: true,
    });
    await visitor.goto('/en/account/addresses');
    await expect(visitor).toHaveURL(/\/en\/login$/);
  });
});
