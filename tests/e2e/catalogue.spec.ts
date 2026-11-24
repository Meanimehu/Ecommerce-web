import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog, freshPhone, pageAs } from './support/login';
import { nextRequestBody } from './support/requests';

/**
 * Slice 2b and 5e (Document 8, Slices 2 and 5): an admin creates the catalogue entries a product needs: an HSN code, a category with
 * attributes and default tax, a brand, a size and a colour; and edits one field of each, checking that exactly that
 * field is sent; and adds, renames and switches off a GST rate. Against the real local backend; skipped where it is not
 * running.
 */
const ADMIN_PHONE = process.env.E2E_ADMIN_PHONE ?? '9000000001';
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

/** Adds an entry to a list through its form: the fields by their labels, in order. */
async function addEntry(admin: Page, list: string, addLabel: string, fields: [string, string][]) {
  await admin.goto(`/en/admin/catalogue/${list}`);
  await admin.getByRole('button', { name: addLabel }).click();
  for (const [label, value] of fields)
    await admin.getByRole('textbox', { name: label, exact: true }).fill(value);
  await admin.getByRole('button', { name: 'Save' }).click();
  await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
}

/**
 * Opens the page of a list that shows this entry. Lists are searched by text, so the entry is on
 * the first page of a long list (the category list has no pages); GST rates cannot be searched (the
 * backend ignores the text), so their pages are gone through in order. Test data piles up, so the
 * entry may be on any page.
 */
async function openPageWith(admin: Page, list: string, entry: string) {
  const editButton = admin.getByRole('button', { name: new RegExp(`^Edit\\s*: ${entry}$`) });
  if (list !== 'gst-rates') {
    await admin.goto(`/en/admin/catalogue/${list}?q=${encodeURIComponent(entry)}`);
    return;
  }
  for (let page = 1; page <= 20; page += 1) {
    await admin.goto(`/en/admin/catalogue/${list}?page=${page}`);
    // The list has loaded (a phone shows its rows as cards, not a table).
    await expect(admin.getByRole('button', { name: /^Switch (on|off)/ }).first()).toBeVisible();
    if ((await editButton.count()) > 0) return;
  }
  throw new Error(`${entry} is on none of the first 20 pages of ${list}`);
}

/**
 * Edits one field of an entry and checks that exactly that field is sent, and that the list shows the new value after
 * a reload (Document 7, 20.12, item 8).
 */
async function editOneField(
  admin: Page,
  list: string,
  entry: string,
  label: string,
  value: string,
  field: string,
) {
  await openPageWith(admin, list, entry);
  await admin.getByRole('button', { name: new RegExp(`^Edit\\s*: ${entry}$`) }).click();
  await admin.getByRole('textbox', { name: label, exact: true }).fill(value);
  const sent = nextRequestBody(admin, 'PATCH', new RegExp(`^/api/admin/catalogue/${list}/[^/]+$`));
  await admin.getByRole('button', { name: 'Save' }).click();
  expect(await sent).toEqual({ [field]: value });
  await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
  await admin.reload();
  await expect(
    admin.getByText(value, { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
}

test.describe('catalogue lists', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(120_000);

  test('an admin adds an HSN code, a category with an attribute, a brand, a size and a colour', async ({
    browser,
  }) => {
    const stamp = String(Date.now()).slice(-6);
    const admin = await pageAs(browser, ADMIN_PHONE, '/en/admin/catalogue');
    await expect(admin).toHaveURL(/\/en\/admin\/catalogue\/categories$/);
    await expect(admin.getByRole('heading', { name: 'Catalogue lists', level: 1 })).toBeVisible();
    await noAxeViolations(admin);

    // HSN code
    await admin.getByRole('link', { name: 'HSN codes' }).click();
    await admin.getByRole('button', { name: 'Add HSN code' }).click();
    await admin.getByRole('textbox', { name: 'HSN code', exact: true }).fill(`62${stamp}`);
    await admin
      .getByRole('textbox', { name: 'Description', exact: true })
      .fill(`Test garments ${stamp}`);
    await admin.getByRole('combobox', { name: 'Default GST rate' }).selectOption({ label: '12%' });
    await noAxeViolations(admin);
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
    await admin.getByRole('searchbox', { name: 'Search' }).fill(`62${stamp}`);
    await admin.getByRole('button', { name: 'Show results' }).click();
    await expect(
      admin.getByText(`Test garments ${stamp}`).filter({ visible: true }).first(),
    ).toBeVisible();

    // Category with a choice attribute: a bad key is shown on that attribute.
    await admin.getByRole('link', { name: 'Categories' }).click();
    await admin.getByRole('button', { name: 'Add category' }).click();
    await admin.getByRole('textbox', { name: 'Name', exact: true }).fill(`Test kurtas ${stamp}`);
    await admin.getByRole('combobox', { name: 'Default HSN code' }).selectOption(`62${stamp}`);
    await admin.getByRole('button', { name: 'Add attribute' }).click();
    const attribute = admin.getByRole('group', { name: 'Attribute 1' });
    await attribute.getByLabel('Key').fill('Fabric Type');
    await attribute.getByLabel('Label').fill('Fabric');
    await attribute.getByLabel('Type').selectOption('choice');
    await attribute.getByLabel('Options').fill('Cotton\nSilk');
    await attribute.getByLabel('Vendors must give a value').check();
    // A ticked box looks ticked: an ink fill with the tick drawn on it (Document 6, 8.4).
    const ticked = attribute.getByLabel('Vendors must give a value');
    await expect(ticked).toHaveCSS('background-color', 'rgb(43, 44, 48)');
    await expect(ticked).toHaveCSS('background-image', /^url\("data:image\/svg\+xml/);
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(
      admin.getByRole('alert').filter({ hasText: /Fix 1 thing to continue/ }),
    ).toBeFocused();
    await expect(attribute.getByLabel('Key')).toHaveAttribute('aria-invalid', 'true');
    await attribute.getByLabel('Key').fill('fabric');
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
    await expect(
      admin.getByText(`Test kurtas ${stamp}`, { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await noAxeViolations(admin);

    // Brand: a name already used is refused under the name.
    await admin.getByRole('link', { name: 'Brands' }).click();
    await admin.getByRole('button', { name: 'Add brand' }).click();
    await admin.getByRole('textbox', { name: 'Name', exact: true }).fill('Urban Loom');
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(
      admin.getByRole('textbox', { name: 'Name', exact: true }),
    ).toHaveAccessibleDescription(/This name is already used/);
    await admin.getByRole('textbox', { name: 'Name', exact: true }).fill(`Test Brand ${stamp}`);
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();

    // Switch it off and on again: nothing is deleted.
    await admin.getByRole('searchbox', { name: 'Search' }).fill(`Test Brand ${stamp}`);
    await admin.getByRole('button', { name: 'Show results' }).click();
    await admin
      .getByRole('button', { name: new RegExp(`^Switch off\\s*: Test Brand ${stamp}$`) })
      .click();
    await expect(
      admin.getByRole('status').filter({ hasText: `Test Brand ${stamp} switched off` }),
    ).toBeVisible();
    await admin
      .getByRole('button', { name: new RegExp(`^Switch on\\s*: Test Brand ${stamp}$`) })
      .click();
    await expect(
      admin.getByRole('status').filter({ hasText: `Test Brand ${stamp} switched on` }),
    ).toBeVisible();

    // Size and colour
    await admin.getByRole('link', { name: 'Sizes' }).click();
    await admin.getByRole('button', { name: 'Add size' }).click();
    await admin.getByRole('textbox', { name: 'Code', exact: true }).fill(`T${stamp.slice(-4)}`);
    await admin.getByRole('textbox', { name: 'Label', exact: true }).fill(`Test size ${stamp}`);
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();

    await admin.getByRole('link', { name: 'Colours' }).click();
    await admin.getByRole('button', { name: 'Add colour' }).click();
    await admin.getByRole('textbox', { name: 'Code', exact: true }).fill(`C${stamp}`);
    await admin.getByRole('textbox', { name: 'Label', exact: true }).fill(`Test colour ${stamp}`);
    await admin.getByRole('textbox', { name: /^Colour value/ }).fill('#zz0000');
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByRole('textbox', { name: /^Colour value/ })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await admin.getByRole('textbox', { name: /^Colour value/ }).fill('#1F5A8C');
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
    await noAxeViolations(admin);
  });

  test('an admin edits one field of each list, and only that field is sent', async ({
    browser,
  }) => {
    const stamp = String(Date.now()).slice(-6);
    const admin = await pageAs(browser, ADMIN_PHONE, '/en/admin/catalogue');
    await addEntry(admin, 'hsn-codes', 'Add HSN code', [
      ['HSN code', `63${stamp}`],
      ['Description', `Edit garments ${stamp}`],
    ]);
    await editOneField(
      admin,
      'hsn-codes',
      `63${stamp}`,
      'Description',
      `Edit garments ${stamp} changed`,
      'description',
    );
    await addEntry(admin, 'categories', 'Add category', [['Name', `Edit kurtas ${stamp}`]]);
    await editOneField(
      admin,
      'categories',
      `Edit kurtas ${stamp}`,
      'Name',
      `Edit kurtas ${stamp} changed`,
      'name',
    );
    await addEntry(admin, 'brands', 'Add brand', [['Name', `Edit Brand ${stamp}`]]);
    await editOneField(
      admin,
      'brands',
      `Edit Brand ${stamp}`,
      'Name',
      `Edit Brand ${stamp} changed`,
      'name',
    );
    await addEntry(admin, 'sizes', 'Add size', [
      ['Code', `E${stamp.slice(-4)}`],
      ['Label', `Edit size ${stamp}`],
    ]);
    await editOneField(
      admin,
      'sizes',
      `E${stamp.slice(-4)}`,
      'Label',
      `Edit size ${stamp} changed`,
      'label',
    );
    await addEntry(admin, 'colours', 'Add colour', [
      ['Code', `E${stamp}`],
      ['Label', `Edit colour ${stamp}`],
    ]);
    await editOneField(
      admin,
      'colours',
      `E${stamp}`,
      'Label',
      `Edit colour ${stamp} changed`,
      'label',
    );
  });

  test('GST rates: an admin adds a rate in per cent, changes its label and switches it off; a rate that exists is refused', async ({
    browser,
  }) => {
    const admin = await pageAs(browser, ADMIN_PHONE, '/en/admin/catalogue/gst-rates');
    await expect(admin.getByRole('link', { name: 'GST rates' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(admin.getByText('Rates never change.', { exact: false })).toBeVisible();
    // The backend does not search GST rates by text, so no search box is offered.
    await expect(admin.getByRole('searchbox')).toHaveCount(0);
    await noAxeViolations(admin);

    // Only a percentage is accepted, and a rate that exists is refused under the rate.
    await admin.getByRole('button', { name: 'Add GST rate' }).click();
    const rateBox = admin.getByRole('textbox', { name: 'Rate (%)', exact: true });
    await rateBox.fill('12,5');
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(
      admin.getByText('Enter a percentage from 0 to 100', { exact: false }).first(),
    ).toBeVisible();
    await rateBox.fill('5');
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByText('This code already exists.').first()).toBeVisible();
    await expect(rateBox).toHaveAttribute('aria-invalid', 'true');

    // A new rate, typed in per cent, is sent in basis points; with no label the backend names it.
    // Rates stay in the local database, so each run picks one that is unlikely to be taken.
    const rateBps = 1 + Math.floor(Math.random() * 9_998);
    const percent = String(rateBps / 100);
    await rateBox.fill(percent);
    const sent = nextRequestBody(admin, 'POST', /^\/api\/admin\/catalogue\/gst-rates$/);
    await admin.getByRole('button', { name: 'Save' }).click();
    expect(await sent).toEqual({ rateBps });
    await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();

    // Its label changes; the rate itself is shown, not offered for change.
    await editOneField(admin, 'gst-rates', `${percent}%`, 'Label', `Test rate ${rateBps}`, 'label');
    await openPageWith(admin, 'gst-rates', `Test rate ${rateBps}`);
    await admin
      .getByRole('button', { name: new RegExp(`^Edit\\s*: Test rate ${rateBps}$`) })
      .click();
    await expect(admin.getByText('A rate never changes.', { exact: false })).toBeVisible();
    await expect(admin.getByRole('textbox', { name: 'Rate (%)' })).toHaveCount(0);
    await admin.getByRole('button', { name: 'Cancel' }).click();

    // Switched off, so no product form offers it.
    await admin
      .getByRole('button', { name: new RegExp(`^Switch off\\s*: Test rate ${rateBps}$`) })
      .click();
    await expect(
      admin.getByRole('status').filter({ hasText: `Test rate ${rateBps} switched off` }),
    ).toBeVisible();
  });

  test('the Hindi page, and a customer gets a real 403', async ({ browser }) => {
    const admin = await pageAs(browser, ADMIN_PHONE, '/hi/admin/catalogue/brands');
    await expect(admin.getByRole('heading', { name: 'कैटलॉग सूचियाँ', level: 1 })).toBeVisible();
    await noAxeViolations(admin);
    const customer = await pageAs(browser, freshPhone(), '/en/account');
    const response = await customer.goto('/en/admin/catalogue/brands');
    expect(response?.status()).toBe(403);
  });
});
