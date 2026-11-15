import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { backendLog, freshPhone, pageAs } from './support/login';
import {
  admin,
  approvedProduct,
  backend,
  staff,
  twoSizesAndColours,
  variantsOf,
} from './support/products';

/**
 * The page frames (Document 5, section 5; Document 6, 7.3): the storefront header, the language
 * switch, and the Vendor and Admin frame with its menus, on wide screens and as a drawer on phones,
 * and the Admin home. Written before the step 10 clean-up and passing on the code before it, so it
 * describes what must not change (Document 7, 20.13). Against the real local backend; skipped where
 * it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };
const PHONE = { width: 390, height: 844 };
const MODERATOR_PHONE = process.env.E2E_MODERATOR_PHONE ?? '9000000002';
const VENDOR_PHONE = process.env.E2E_VENDOR_PHONE ?? '9000000011';

/** On compact screens the language switch is in the storefront menu (Document 6, 7.3): open it. */
async function openMenuIfCompact(page: Page) {
  const menu = page.getByRole('banner').locator('summary');
  if (await menu.isVisible()) await menu.click();
}

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

/** The links of the area's side menu on a wide screen, in order. */
async function sideMenu(page: Page, label = 'Menu') {
  const menu = page.locator('aside').getByRole('navigation', { name: label });
  await expect(menu).toBeVisible();
  return menu.getByRole('link');
}

test('the storefront header logged out: "Log in" and the cart, with no count', async ({ page }) => {
  await page.goto('/en');
  const header = page.getByRole('banner');
  await expect(header.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/en/login');
  await openMenuIfCompact(page);
  await expect(header.getByRole('link', { name: 'Cart', exact: true })).toHaveAttribute(
    'href',
    '/en/cart',
  );
  await expect(header.getByRole('link', { name: 'हिन्दी' })).toHaveAttribute('href', '/hi');
});

test('the language switch opens the same page in the other language and remembers the choice', async ({
  page,
}) => {
  // The login page, which needs no backend, so this also runs in CI.
  await page.goto('/en/login');
  await openMenuIfCompact(page);
  await page.getByRole('banner').getByRole('link', { name: 'हिन्दी' }).click();
  await expect(page).toHaveURL(/\/hi\/login$/);
  expect(
    (await page.context().cookies()).find((cookie) => cookie.name === '__Host-dhaaga_lang')?.value,
  ).toBe('hi');
  await openMenuIfCompact(page);
  await expect(page.getByRole('banner').getByRole('link', { name: 'English' })).toHaveAttribute(
    'href',
    '/en/login',
  );
  // A visit with no language in the address now goes to Hindi.
  await page.goto('/');
  await expect(page).toHaveURL(/\/hi$/);
});

test.describe('with the local backend', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');

  test('the storefront header logged in: "Account" and the cart with its count', async ({
    browser,
  }) => {
    const people = await staff(browser);
    const { sizes, colours } = await twoSizesAndColours(people.vendor);
    const productId = await approvedProduct(
      people.vendor,
      people.moderator,
      `Layout kurta ${Date.now()}`,
      [
        {
          sizeCode: sizes[0]?.code ?? '',
          colourCode: colours[0]?.code ?? '',
          pricePaise: 99900,
          stock: 20,
        },
      ],
    );
    const [variant] = await variantsOf(people.vendor, productId);
    const customer = await pageAs(browser, freshPhone(), '/en/account');
    await backend(customer, 'POST', '/cart/items', { variantId: variant?.id, quantity: 2 });
    await customer.goto('/en');
    const header = customer.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Account' })).toHaveAttribute(
      'href',
      '/en/account',
    );
    await expect(header.getByRole('link', { name: /^Cart\s*2\s*items$/ })).toHaveAttribute(
      'href',
      '/en/cart',
    );
    await expect(header.getByRole('link', { name: 'Log in' })).toHaveCount(0);
  });

  test('the Vendor area: a person with no vendor sees only the application; a vendor also sees Home and Products', async ({
    browser,
  }) => {
    const applicant = await pageAs(browser, freshPhone(), '/en/vendor/apply');
    await applicant.setViewportSize(WIDE);
    await expect(applicant.getByText('Vendor area', { exact: true })).toBeVisible();
    const applicantMenu = await sideMenu(applicant);
    await expect(applicantMenu).toHaveText(['Application']);
    await expect(applicantMenu.first()).toHaveAttribute('aria-current', 'page');

    const vendor = await pageAs(browser, VENDOR_PHONE, '/en/vendor/products');
    await vendor.setViewportSize(WIDE);
    const vendorMenu = await sideMenu(vendor);
    await expect(vendorMenu).toHaveText(['Home', 'Products', 'Application']);
    await expect(vendorMenu.nth(0)).toHaveAttribute('href', '/en/vendor');
    await expect(vendorMenu.nth(1)).toHaveAttribute('href', '/en/vendor/products');
    await expect(vendorMenu.nth(1)).toHaveAttribute('aria-current', 'page');
    await expect(vendorMenu.nth(2)).toHaveAttribute('href', '/en/vendor/apply');
    await expect(vendor.getByRole('banner').getByRole('link', { name: 'Account' })).toHaveAttribute(
      'href',
      '/en/account',
    );
    await noAxeViolations(vendor);
  });

  test('the Admin area: a moderator sees only product moderation, an admin sees every screen, in the menu and on Admin home', async ({
    browser,
  }) => {
    const moderator = await pageAs(browser, MODERATOR_PHONE, '/en/admin');
    await moderator.setViewportSize(WIDE);
    await expect(moderator.getByText('Admin area', { exact: true })).toBeVisible();
    await expect(await sideMenu(moderator)).toHaveText(['Home', 'Product moderation']);
    const moderatorHome = moderator.getByRole('main').getByRole('link');
    await expect(moderatorHome).toHaveText(['Product moderation']);
    await expect(moderatorHome.first()).toHaveAttribute('href', '/en/admin/moderation');

    const adminPage = await admin(browser);
    await adminPage.setViewportSize(WIDE);
    await expect(await sideMenu(adminPage)).toHaveText([
      'Home',
      'Vendor review',
      'Catalogue lists',
      'Product moderation',
    ]);
    await expect((await sideMenu(adminPage)).first()).toHaveAttribute('aria-current', 'page');
    const adminHome = adminPage.getByRole('main').getByRole('link');
    await expect(adminHome).toHaveText(['Vendor review', 'Catalogue lists', 'Product moderation']);
    await expect(adminHome.nth(0)).toHaveAttribute('href', '/en/admin/vendors');
    await expect(adminHome.nth(1)).toHaveAttribute('href', '/en/admin/catalogue');
    await expect(adminHome.nth(2)).toHaveAttribute('href', '/en/admin/moderation');
    await expect(adminPage.getByRole('heading', { name: 'Admin home', level: 1 })).toBeVisible();
    await noAxeViolations(adminPage);
  });

  test('on a phone the menu is a drawer with the language switch, which opens and closes', async ({
    browser,
  }) => {
    const vendor = await pageAs(browser, VENDOR_PHONE, '/en/vendor');
    await vendor.setViewportSize(PHONE);
    await expect(vendor.locator('aside')).toBeHidden();
    await vendor.getByRole('button', { name: 'Open menu' }).click();
    const drawer = vendor.getByRole('dialog', { name: 'Menu' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('navigation', { name: 'Menu' }).getByRole('link')).toHaveText([
      'Home',
      'Products',
      'Application',
    ]);
    await expect(drawer.getByRole('link', { name: 'हिन्दी' })).toBeVisible();
    await noAxeViolations(vendor);
    await drawer.getByRole('button', { name: 'Close menu' }).click();
    await expect(drawer).toBeHidden();
    // Escape closes it too.
    await vendor.getByRole('button', { name: 'Open menu' }).click();
    await expect(drawer).toBeVisible();
    await vendor.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('the staff frame in Hindi', async ({ browser }) => {
    const vendor = await pageAs(browser, VENDOR_PHONE, '/hi/vendor');
    await vendor.setViewportSize(WIDE);
    await expect(vendor.getByText('विक्रेता क्षेत्र', { exact: true })).toBeVisible();
    await expect(await sideMenu(vendor, 'मेन्यू')).toHaveText(['होम', 'उत्पाद', 'आवेदन']);
    await expect(vendor.getByRole('banner').getByRole('link', { name: 'खाता' })).toHaveAttribute(
      'href',
      '/hi/account',
    );
    await expect(vendor.getByRole('banner').getByRole('link', { name: 'English' })).toBeVisible();
    await noAxeViolations(vendor);
  });
});
