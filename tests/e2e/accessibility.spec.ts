import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Locator, type Page } from '@playwright/test';
import { backendLog, freshPhone, pageAs, readCode } from './support/login';
import {
  approvedProduct,
  backend,
  setStock,
  staff,
  twoSizesAndColours,
  variantsOf,
} from './support/products';

/**
 * Slice 6a (Document 7, section 10; D7-08; Document 5, section 11): the automated accessibility
 * checks for the five core customer journeys. Every screen of journeys 1 to 5, in English and
 * Hindi, with the states a person meets on the way (a filter sheet, suggestions, the code step, an
 * error summary, a problem line, the address form): no WCAG 2.2 AA violation found by axe; no
 * sideways scrolling at 320 px wide (WCAG 1.4.10) or at 200% zoom of a 1280 px window; still no
 * sideways scrolling with the WCAG 1.4.12 text spacing. Then the journeys with the keyboard only,
 * where every focused element shows the focus ring and focus is never dropped; and under reduced
 * motion nothing slides or fades. The manual checks (a screen reader) are not here. Against the
 * real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const LANGS = ['en', 'hi'] as const;

/** The widths checked for sideways scrolling: WCAG 1.4.10, and a 1280 px window at 200% zoom. */
const REFLOW_WIDTHS = [320, 640];

/** WCAG 1.4.12: the spacing a person may set; nothing may need sideways scrolling after it. */
const TEXT_SPACING = `
  * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
  p { margin-bottom: 2em !important; }
`;

/** The words of each screen, per language, used to find things on it. */
const WORDS = {
  en: {
    search: 'Search the shop',
    addToCart: 'Add to cart',
    added: 'Added to cart',
    phone: 'Mobile number',
    code: 'One-time code',
    coupon: 'Coupon code',
    apply: 'Apply',
    couponRefused: 'This coupon code does not exist.',
    quantity: 'Quantity',
    addAddress: 'Add a new address',
    saveAddress: 'Save address',
    filters: /^Filters/,
    filterPanel: 'Filters',
  },
  hi: {
    search: 'दुकान में खोजें',
    addToCart: 'कार्ट में जोड़ें',
    added: 'कार्ट में जोड़ा गया',
    phone: 'मोबाइल नंबर',
    code: 'वन-टाइम कोड',
    coupon: 'कूपन कोड',
    apply: 'लगाएँ',
    couponRefused: 'यह कूपन कोड मौजूद नहीं है।',
    quantity: 'मात्रा',
    addAddress: 'नया पता जोड़ें',
    saveAddress: 'पता सेव करें',
    filters: /^फ़िल्टर/,
    filterPanel: 'फ़िल्टर',
  },
} as const;

async function axeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  return violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
}

/** Elements that stick out past the right edge of the window, when the page scrolls sideways. */
async function sidewaysOverflow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const root = document.documentElement;
    if (root.scrollWidth <= root.clientWidth) return [];
    const width = root.clientWidth;
    const outside: string[] = [];
    for (const element of Array.from(document.body.querySelectorAll('*'))) {
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.right <= width + 1) continue;
      // Only the outermost element that sticks out, not each of its children.
      if (element.parentElement && element.parentElement.getBoundingClientRect().right > width + 1)
        continue;
      const name = element.id ? `#${element.id}` : '';
      const classes = String(element.getAttribute('class') ?? '')
        .split(' ')
        .slice(0, 3)
        .join('.');
      outside.push(
        `${element.tagName.toLowerCase()}${name}${classes ? `.${classes}` : ''} (${Math.round(box.right)} px)`,
      );
    }
    return outside.length > 0 ? outside : [`the page is ${root.scrollWidth} px wide`];
  });
}

/** Every screen check at once, so one run lists every problem: axe, the widths, the spacing. */
async function checkScreen(page: Page, screen: string): Promise<string[]> {
  const problems: string[] = [];
  for (const violation of await axeViolations(page)) problems.push(`${screen}: axe ${violation}`);
  const viewport = page.viewportSize();
  for (const width of REFLOW_WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    // Layout that follows the width (a media query in a script) settles first.
    await page.waitForTimeout(150);
    for (const element of await sidewaysOverflow(page))
      problems.push(`${screen} at ${width} px: ${element}`);
  }
  const spacing = await page.addStyleTag({ content: TEXT_SPACING });
  await page.waitForTimeout(150);
  for (const element of await sidewaysOverflow(page))
    problems.push(`${screen} with text spacing: ${element}`);
  await spacing.evaluate((style) => (style as HTMLStyleElement).remove());
  if (viewport) await page.setViewportSize(viewport);
  return problems;
}

/** Where focus is now, and whether it shows the focus ring (on itself or its nearest parents). */
async function focusNow(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!element || element === document.body) return { onBody: true, ring: false, name: 'body' };
    let node: Element | null = element;
    let ring = false;
    for (let depth = 0; node && depth < 3 && !ring; depth += 1) {
      const style = getComputedStyle(node);
      ring =
        style.boxShadow !== 'none' ||
        (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0);
      node = node.parentElement;
    }
    const label =
      element.getAttribute('aria-label') ??
      (element.textContent ?? '').trim().slice(0, 40) ??
      element.tagName;
    return { onBody: false, ring, name: `${element.tagName.toLowerCase()} "${label}"` };
  });
}

/**
 * Presses Tab until the target has focus, checking the ring at every stop. Fails if the target is
 * not reached, or any stop on the way has no visible focus.
 */
async function tabTo(page: Page, target: Locator, most = 150) {
  const noRing: string[] = [];
  for (let press = 0; press < most; press += 1) {
    await page.keyboard.press('Tab');
    const focus = await focusNow(page);
    if (!focus.onBody && !focus.ring) noRing.push(focus.name);
    if (await target.evaluate((element) => element === document.activeElement)) {
      expect(noRing, 'every focused element shows the focus ring').toEqual([]);
      return;
    }
  }
  throw new Error(`Tab never reached ${String(target)}`);
}

/** After an action on the page (not a page change), focus stays somewhere, never on the page itself. */
async function expectFocusKept(page: Page) {
  await expect.poll(async () => (await focusNow(page)).onBody).toBe(false);
}

const isPhone = () => test.info().project.name.includes('phone');

function newVisitor(browser: Browser) {
  const use = test.info().project.use;
  return browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: use.baseURL,
    viewport: use.viewport,
    userAgent: use.userAgent,
    deviceScaleFactor: use.deviceScaleFactor,
    isMobile: use.isMobile,
    hasTouch: use.hasTouch,
  });
}

test.describe('accessibility of the five customer journeys', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(240_000);

  // One product: size S (in stock), size M (5 left) and a second colour in S, which a cart line
  // holds and then runs out of, so the cart has a problem line.
  const product = {
    id: '',
    title: '',
    word: '',
    small: '',
    colour: '',
    smallId: '',
    soldOutId: '',
  };
  let vendor: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    const people = await staff(browser);
    vendor = people.vendor;
    const { sizes, colours } = await twoSizesAndColours(vendor);
    const [small, medium] = sizes as [
      { code: string; label: string },
      { code: string; label: string },
    ];
    const [first, second] = colours as unknown as [
      { code: string; label: string },
      { code: string },
    ];
    product.colour = first.label;
    product.word = `Reachable${String(Date.now()).slice(-6)}`;
    product.title = `${product.word} kurta`;
    product.small = small.label;
    product.id = await approvedProduct(vendor, people.moderator, product.title, [
      { sizeCode: small.code, colourCode: first.code, pricePaise: 99900, stock: 20 },
      { sizeCode: medium.code, colourCode: first.code, pricePaise: 109900, stock: 5 },
      { sizeCode: small.code, colourCode: second.code, pricePaise: 99900, stock: 3 },
    ]);
    const variants = await variantsOf(vendor, product.id);
    product.smallId =
      variants.find(
        (variant) => variant.sizeCode === small.code && variant.colourCode === first.code,
      )?.id ?? '';
    product.soldOutId =
      variants.find(
        (variant) => variant.sizeCode === small.code && variant.colourCode === second.code,
      )?.id ?? '';
  });

  for (const lang of LANGS) {
    test(`journeys 1 and 2 in ${lang}: home, a category and its filters, search, a product`, async ({
      page,
    }) => {
      const words = WORDS[lang];
      const problems: string[] = [];

      await page.goto(`/${lang}`);
      problems.push(...(await checkScreen(page, 'home')));

      // Journey 1: the search suggestions open.
      const box = page.getByRole('combobox', { name: words.search });
      await box.first().pressSequentially(product.word, { delay: 30 });
      await expect(async () => {
        await expect(page.getByRole('option', { name: product.title })).toBeVisible({
          timeout: 2_000,
        });
      }).toPass({ timeout: 15_000 });
      problems.push(
        ...(await axeViolations(page)).map((violation) => `suggestions: axe ${violation}`),
      );

      await page.goto(`/${lang}/category/kurtas`);
      problems.push(...(await checkScreen(page, 'category')));
      await page.goto(`/${lang}/category/kurtas?sort=price_desc`);
      if (isPhone()) {
        await page.getByRole('button', { name: words.filters }).click();
        await expect(page.getByRole('dialog', { name: words.filterPanel })).toBeVisible();
        problems.push(
          ...(await axeViolations(page)).map((violation) => `filter sheet: axe ${violation}`),
        );
      } else {
        problems.push(...(await checkScreen(page, 'sorted category')));
      }

      await page.goto(`/${lang}/search?q=${encodeURIComponent(product.word)}`);
      problems.push(...(await checkScreen(page, 'search results')));
      await page.goto(`/${lang}/search?q=nothingmatchesthis`);
      problems.push(...(await checkScreen(page, 'search, nothing found')));

      // Journey 2: a product, with a size chosen and an unavailable colour shown in words.
      await page.goto(`/${lang}/product/${product.id}`);
      await expect(page.getByRole('heading', { name: product.title, level: 1 })).toBeVisible();
      problems.push(...(await checkScreen(page, 'product')));
      await page.getByRole('button', { name: product.small, exact: true }).click();
      problems.push(...(await checkScreen(page, 'product, size chosen')));

      expect(problems).toEqual([]);
    });

    test(`journeys 3 and 4 in ${lang}: login, the code step and its errors, the cart`, async ({
      browser,
    }) => {
      const words = WORDS[lang];
      const problems: string[] = [];

      // Journey 3: the login page, an error summary, the code step.
      const context = await newVisitor(browser);
      const visitor = await context.newPage();
      await visitor.goto(`/${lang}/login`);
      await visitor.waitForLoadState('networkidle');
      problems.push(...(await checkScreen(visitor, 'login')));
      await visitor.getByLabel(words.phone).fill('12');
      await visitor.getByLabel(words.phone).press('Enter');
      await expect(visitor.getByRole('alert').first()).toBeVisible();
      problems.push(...(await checkScreen(visitor, 'login, error summary')));
      await visitor.getByLabel(words.phone).fill(freshPhone());
      await visitor.getByLabel(words.phone).press('Enter');
      await expect(visitor.getByLabel(words.code, { exact: true })).toBeFocused();
      problems.push(...(await checkScreen(visitor, 'login, code step')));
      await visitor.getByLabel(words.code, { exact: true }).fill('000000');
      await visitor.getByLabel(words.code, { exact: true }).press('Enter');
      await expect(visitor.getByRole('alert').first()).toBeVisible();
      problems.push(...(await checkScreen(visitor, 'login, wrong code')));
      await context.close();

      // Journey 4: the empty cart, a cart with a line, a coupon that does not apply, a problem line.
      const customer = await pageAs(browser, freshPhone(), `/${lang}/cart`);
      await customer.waitForLoadState('networkidle');
      problems.push(...(await checkScreen(customer, 'empty cart')));
      await backend(customer, 'POST', '/cart/items', { variantId: product.smallId, quantity: 1 });
      await backend(customer, 'POST', '/cart/items', {
        variantId: product.soldOutId,
        quantity: 1,
      });
      await customer.reload();
      await expect(customer.getByLabel(words.quantity).first()).toBeVisible();
      problems.push(...(await checkScreen(customer, 'cart')));
      await customer.getByLabel(words.coupon).fill('nosuchcode');
      await customer.getByRole('button', { name: words.apply }).click();
      await expect(customer.getByText(words.couponRefused)).toBeVisible();
      problems.push(...(await checkScreen(customer, 'cart, coupon refused')));
      await setStock(vendor, product.soldOutId, 0);
      try {
        await customer.reload();
        await customer.waitForLoadState('networkidle');
        problems.push(...(await checkScreen(customer, 'cart, a line out of stock')));
      } finally {
        await setStock(vendor, product.soldOutId, 3);
      }

      expect(problems).toEqual([]);
    });

    test(`journey 5 in ${lang}: saved addresses, the form and its errors`, async ({ browser }) => {
      const words = WORDS[lang];
      const problems: string[] = [];
      const page = await pageAs(browser, freshPhone(), `/${lang}/account/addresses`);
      await page.waitForLoadState('networkidle');
      problems.push(...(await checkScreen(page, 'no addresses')));
      await page.getByRole('button', { name: words.addAddress }).click();
      const form = page
        .locator('form')
        .filter({ has: page.getByRole('button', { name: words.saveAddress }) });
      await expect(form).toBeVisible();
      problems.push(...(await checkScreen(page, 'address form')));
      await form.getByRole('button', { name: words.saveAddress }).click();
      await expect(page.getByRole('alert').first()).toBeVisible();
      problems.push(...(await checkScreen(page, 'address form, errors')));
      expect(problems).toEqual([]);
    });
  }

  test('journeys 1 to 4 with the keyboard only: find, choose, add, log in, change the cart', async ({
    browser,
  }) => {
    const context = await newVisitor(browser);
    const page = await context.newPage();
    const words = WORDS.en;

    // Journey 1: the search box, a suggestion chosen with the arrow keys.
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    const box = page.getByRole('combobox', { name: words.search }).first();
    await tabTo(page, box);
    await page.keyboard.type(product.word, { delay: 30 });
    await expect(async () => {
      await expect(page.getByRole('option', { name: product.title })).toBeVisible({
        timeout: 2_000,
      });
    }).toPass({ timeout: 15_000 });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: product.title, level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');

    // Journey 2: the first colour is already chosen. "Add to cart" before a size adds nothing and
    // takes focus to the sizes; Enter chooses one; then "Add to cart" (logged out) goes to log in.
    const colour = page.getByRole('button', { name: product.colour, exact: true });
    await expect(colour).toHaveAttribute('aria-pressed', 'true');
    const size = page.getByRole('button', { name: product.small, exact: true });
    await tabTo(page, page.getByRole('button', { name: words.addToCart }));
    await page.keyboard.press('Enter');
    await expect(size).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(size).toHaveAttribute('aria-pressed', 'true');
    await expectFocusKept(page);
    await tabTo(page, page.getByRole('button', { name: words.addToCart }));
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/en\/login$/);
    await page.waitForLoadState('networkidle');

    // Journey 3: the number, Enter; focus moves to the code; the code, Enter; back to the product.
    const phone = freshPhone();
    await tabTo(page, page.getByLabel(words.phone));
    await page.keyboard.type(phone);
    await page.keyboard.press('Enter');
    await expect(page.getByLabel(words.code, { exact: true })).toBeFocused();
    await page.keyboard.type(await readCode(phone));
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/en/product/${product.id}/`));
    await expect(page.getByRole('status').filter({ hasText: words.added })).toBeVisible();

    // Journey 4: the cart link, the quantity with the arrow keys, a coupon with Enter.
    await page.waitForLoadState('networkidle');
    await tabTo(page, page.getByRole('link', { name: /^Cart\s*1\s*item$/ }));
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/en\/cart$/);
    await page.waitForLoadState('networkidle');
    const quantity = page.getByLabel(words.quantity);
    await tabTo(page, quantity);
    await page.keyboard.press('ArrowDown');
    await expect(quantity).toHaveValue('2');
    await expect(page.getByRole('link', { name: /^Cart\s*2\s*items$/ })).toBeVisible();
    await expectFocusKept(page);
    const coupon = page.getByLabel(words.coupon);
    await tabTo(page, coupon);
    await page.keyboard.type('nosuchcode');
    await page.keyboard.press('Enter');
    await expect(page.getByText(words.couponRefused)).toBeVisible();
    await expectFocusKept(page);
    await context.close();
  });

  test('journey 1 with the keyboard: a filter, and on a phone the filter sheet keeps focus inside', async ({
    page,
  }) => {
    await page.goto('/en/category/kurtas');
    await page.waitForLoadState('networkidle');
    if (isPhone()) {
      const opener = page.getByRole('button', { name: WORDS.en.filters });
      await tabTo(page, opener);
      await page.keyboard.press('Enter');
      const sheet = page.getByRole('dialog', { name: WORDS.en.filterPanel });
      await expect(sheet).toBeVisible();
      // Tab goes round the sheet, never behind it.
      for (let press = 0; press < 40; press += 1) {
        await page.keyboard.press('Tab');
        const inside = await sheet.evaluate((element) => element.contains(document.activeElement));
        expect(inside, 'focus stays in the open filter sheet').toBe(true);
        const focus = await focusNow(page);
        expect(focus.ring, `${focus.name} shows the focus ring`).toBe(true);
      }
      await page.keyboard.press('Escape');
      await expect(sheet).toBeHidden();
      await expect(opener).toBeFocused();
      return;
    }
    const panel = page.getByRole('complementary', { name: WORDS.en.filterPanel });
    const size = panel.getByRole('checkbox', { name: new RegExp(`^${product.small}\\s+\\d+$`) });
    await tabTo(page, size);
    await page.keyboard.press('Space');
    await expect(page).toHaveURL(/[?&]size=/);
    await expect(size).toBeChecked();
    await expect(size).toBeFocused();
  });

  test('journey 5 with the keyboard only: add an address', async ({ browser }) => {
    const page = await pageAs(browser, freshPhone(), '/en/account/addresses');
    await page.waitForLoadState('networkidle');
    await tabTo(page, page.getByRole('button', { name: WORDS.en.addAddress }));
    await page.keyboard.press('Enter');
    const form = page.locator('form').filter({ has: page.getByLabel('Address line 1') });
    await expect(form).toBeVisible();
    await expectFocusKept(page);
    const fields: [string, string][] = [
      ['Name', 'Asha Rao'],
      ['Mobile number', '9876543210'],
      ['Address line 1', '12 Hawa Mahal Road'],
      ['City', 'Jaipur'],
      ['State', 'Rajasthan'],
      ['Pin code', '302002'],
    ];
    for (const [label, value] of fields) {
      await tabTo(page, form.getByLabel(label, { exact: true }), 40);
      await page.keyboard.type(value);
    }
    await tabTo(page, form.getByRole('button', { name: WORDS.en.saveAddress }), 40);
    await page.keyboard.press('Enter');
    await expect(page.getByText(/12 Hawa Mahal Road/)).toBeVisible();
    await expectFocusKept(page);

    // Changing it: "Edit" opens the form in place, and focus goes with it.
    await tabTo(page, page.getByRole('button', { name: 'Edit' }), 40);
    await page.keyboard.press('Enter');
    await expect(form).toBeVisible();
    await expectFocusKept(page);
  });

  test('the checks find what they look for: a too-wide block, a missing label, a lost ring', async ({
    page,
  }) => {
    // So a passing run means the pages are right, not that the checks cannot see.
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      const wide = document.createElement('div');
      wide.style.width = '900px';
      wide.style.height = '10px';
      const unnamed = document.createElement('input');
      unnamed.id = 'check-unnamed';
      document.querySelector('main')?.append(wide, unnamed);
    });
    const problems = await checkScreen(page, 'home, broken on purpose');
    expect(problems.some((problem) => problem.includes('at 320 px'))).toBe(true);
    expect(problems.some((problem) => problem.includes('axe label'))).toBe(true);
    await page.addStyleTag({ content: '#check-unnamed:focus-visible { box-shadow: none; }' });
    await page.locator('#check-unnamed').focus();
    expect((await focusNow(page)).ring).toBe(false);
  });

  test('under reduced motion nothing slides, fades or spins', async ({ browser }) => {
    const context = await newVisitor(browser);
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/en/product/${product.id}`);
    await page.waitForLoadState('networkidle');
    // Something that moves: on a phone, the menu opened.
    if (isPhone()) await page.locator('header summary', { hasText: 'Menu' }).click();
    const moving = await page.evaluate(() => {
      const seconds = (value: string) =>
        Math.max(
          ...value.split(',').map((part) => {
            const number = parseFloat(part);
            return part.trim().endsWith('ms') ? number / 1000 : number;
          }),
        );
      const found: string[] = [];
      for (const element of Array.from(document.querySelectorAll('*'))) {
        const style = getComputedStyle(element);
        const animation = style.animationName !== 'none' ? seconds(style.animationDuration) : 0;
        const transition = seconds(style.transitionDuration);
        if (animation > 0.001 || transition > 0.001)
          found.push(
            `${element.tagName.toLowerCase()}.${String(element.getAttribute('class') ?? '').slice(0, 40)}`,
          );
      }
      return found;
    });
    expect(moving).toEqual([]);
    await context.close();
  });
});
