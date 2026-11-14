import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog, freshPhone, pageAs } from './support/login';
import { nextRequestBody } from './support/requests';

/**
 * Slice 2b (Document 8, Slice 2): an admin creates the catalogue entries a product needs: an HSN code, a category with
 * attributes and default tax, a brand, a size and a colour; and edits one field of each, checking that exactly that
 * field is sent. Against the real local backend; skipped where it is not running.
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
  // Searched for, so the entry is on the first page of a long list (the category list has no pages).
  await admin.goto(`/en/admin/catalogue/${list}?q=${encodeURIComponent(entry)}`);
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
    const n = String(Date.now()).slice(-6);
    const admin = await pageAs(browser, ADMIN_PHONE, '/en/admin/catalogue');
    await expect(admin).toHaveURL(/\/en\/admin\/catalogue\/categories$/);
    await expect(admin.getByRole('heading', { name: 'Catalogue lists', level: 1 })).toBeVisible();
    await noAxeViolations(admin);

    // HSN code
    await admin.getByRole('link', { name: 'HSN codes' }).click();
    await admin.getByRole('button', { name: 'Add HSN code' }).click();
    await admin.getByRole('textbox', { name: 'HSN code', exact: true }).fill(`62${n}`);
    await admin
      .getByRole('textbox', { name: 'Description', exact: true })
      .fill(`Test garments ${n}`);
    await admin.getByRole('combobox', { name: 'Default GST rate' }).selectOption({ label: '12%' });
    await noAxeViolations(admin);
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
    await admin.getByRole('searchbox', { name: 'Search' }).fill(`62${n}`);
    await admin.getByRole('button', { name: 'Show results' }).click();
    await expect(
      admin.getByText(`Test garments ${n}`).filter({ visible: true }).first(),
    ).toBeVisible();

    // Category with a choice attribute: a bad key is shown on that attribute.
    await admin.getByRole('link', { name: 'Categories' }).click();
    await admin.getByRole('button', { name: 'Add category' }).click();
    await admin.getByRole('textbox', { name: 'Name', exact: true }).fill(`Test kurtas ${n}`);
    await admin.getByRole('combobox', { name: 'Default HSN code' }).selectOption(`62${n}`);
    await admin.getByRole('button', { name: 'Add attribute' }).click();
    const attribute = admin.getByRole('group', { name: 'Attribute 1' });
    await attribute.getByLabel('Key').fill('Fabric Type');
    await attribute.getByLabel('Label').fill('Fabric');
    await attribute.getByLabel('Type').selectOption('choice');
    await attribute.getByLabel('Options').fill('Cotton\nSilk');
    await attribute.getByLabel('Vendors must give a value').check();
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(
      admin.getByRole('alert').filter({ hasText: /Fix 1 thing to continue/ }),
    ).toBeFocused();
    await expect(attribute.getByLabel('Key')).toHaveAttribute('aria-invalid', 'true');
    await attribute.getByLabel('Key').fill('fabric');
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
    await expect(
      admin.getByText(`Test kurtas ${n}`, { exact: true }).filter({ visible: true }),
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
    await admin.getByRole('textbox', { name: 'Name', exact: true }).fill(`Test Brand ${n}`);
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();

    // Switch it off and on again: nothing is deleted.
    await admin.getByRole('searchbox', { name: 'Search' }).fill(`Test Brand ${n}`);
    await admin.getByRole('button', { name: 'Show results' }).click();
    await admin
      .getByRole('button', { name: new RegExp(`^Switch off\\s*: Test Brand ${n}$`) })
      .click();
    await expect(
      admin.getByRole('status').filter({ hasText: `Test Brand ${n} switched off` }),
    ).toBeVisible();
    await admin
      .getByRole('button', { name: new RegExp(`^Switch on\\s*: Test Brand ${n}$`) })
      .click();
    await expect(
      admin.getByRole('status').filter({ hasText: `Test Brand ${n} switched on` }),
    ).toBeVisible();

    // Size and colour
    await admin.getByRole('link', { name: 'Sizes' }).click();
    await admin.getByRole('button', { name: 'Add size' }).click();
    await admin.getByRole('textbox', { name: 'Code', exact: true }).fill(`T${n.slice(-4)}`);
    await admin.getByRole('textbox', { name: 'Label', exact: true }).fill(`Test size ${n}`);
    await admin.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();

    await admin.getByRole('link', { name: 'Colours' }).click();
    await admin.getByRole('button', { name: 'Add colour' }).click();
    await admin.getByRole('textbox', { name: 'Code', exact: true }).fill(`C${n}`);
    await admin.getByRole('textbox', { name: 'Label', exact: true }).fill(`Test colour ${n}`);
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
    const n = String(Date.now()).slice(-6);
    const admin = await pageAs(browser, ADMIN_PHONE, '/en/admin/catalogue');
    await addEntry(admin, 'hsn-codes', 'Add HSN code', [
      ['HSN code', `63${n}`],
      ['Description', `Edit garments ${n}`],
    ]);
    await editOneField(
      admin,
      'hsn-codes',
      `63${n}`,
      'Description',
      `Edit garments ${n} changed`,
      'description',
    );
    await addEntry(admin, 'categories', 'Add category', [['Name', `Edit kurtas ${n}`]]);
    await editOneField(
      admin,
      'categories',
      `Edit kurtas ${n}`,
      'Name',
      `Edit kurtas ${n} changed`,
      'name',
    );
    await addEntry(admin, 'brands', 'Add brand', [['Name', `Edit Brand ${n}`]]);
    await editOneField(
      admin,
      'brands',
      `Edit Brand ${n}`,
      'Name',
      `Edit Brand ${n} changed`,
      'name',
    );
    await addEntry(admin, 'sizes', 'Add size', [
      ['Code', `E${n.slice(-4)}`],
      ['Label', `Edit size ${n}`],
    ]);
    await editOneField(
      admin,
      'sizes',
      `E${n.slice(-4)}`,
      'Label',
      `Edit size ${n} changed`,
      'label',
    );
    await addEntry(admin, 'colours', 'Add colour', [
      ['Code', `E${n}`],
      ['Label', `Edit colour ${n}`],
    ]);
    await editOneField(admin, 'colours', `E${n}`, 'Label', `Edit colour ${n} changed`, 'label');
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
