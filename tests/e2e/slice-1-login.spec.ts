import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { backendLog, backendLogin, blockUser, freshPhone, logIn, readCode } from './support/login';

/**
 * Slice 1 "done when" (Document 8): log in by phone code, stay logged in, refresh safely, logout and log out everywhere,
 * wrong role gets a real 403. Against the real local backend; skipped where it is not running.
 */
test.describe('login and sessions', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');

  test('log in, return to the page asked for, stay logged in, log out', async ({ page, context }) => {
    await page.goto('/en/account');
    await expect(page).toHaveURL(/\/en\/login$/);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);

    const phone = freshPhone();
    await logIn(page, phone);
    await expect(page).toHaveURL(/\/en\/account$/);
    await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();
    await expect(page.getByText(`+91 ${phone.slice(0, 5)} ${phone.slice(5)}`)).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);

    // Cookies: __Host-, Secure, HttpOnly, SameSite=Lax, path / (D4-07).
    const cookies = await context.cookies();
    for (const name of ['__Host-dhaaga_at', '__Host-dhaaga_rt']) {
      const cookie = cookies.find((c) => c.name === name);
      expect(cookie, name).toBeTruthy();
      expect(cookie).toMatchObject({ secure: true, httpOnly: true, sameSite: 'Lax', path: '/' });
    }
    expect(cookies.find((c) => c.name === '__Host-dhaaga_next')).toBeFalsy();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();

    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/\/en$/);
    const after = (await context.cookies()).map((c) => c.name);
    expect(after).not.toContain('__Host-dhaaga_at');
    expect(after).not.toContain('__Host-dhaaga_rt');
    await page.goto('/en/account');
    await expect(page).toHaveURL(/\/en\/login$/);
  });

  test('an expired access token is refreshed without the person noticing; a used refresh token is never sent again', async ({ page, context }) => {
    await page.goto('/en/login');
    await logIn(page, freshPhone());
    await expect(page).toHaveURL(/\/en$/);

    const before = await context.cookies();
    const oldRefresh = before.find((c) => c.name === '__Host-dhaaga_rt');
    await context.clearCookies({ name: '__Host-dhaaga_at' });

    await page.goto('/en/account');
    await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();
    const after = await context.cookies();
    const newRefresh = after.find((c) => c.name === '__Host-dhaaga_rt');
    expect(after.find((c) => c.name === '__Host-dhaaga_at')).toBeTruthy();
    expect(newRefresh?.value).not.toBe(oldRefresh?.value);

    // Another tab still sending the old refresh cookie: it uses the stored result and never refreshes again.
    const other = await context.browser()!.newContext({ ignoreHTTPSErrors: true });
    await other.addCookies([{ ...oldRefresh!, sameSite: 'Lax' }]);
    const tab = await other.newPage();
    const answer = await tab.request.get('/api/session');
    expect(answer.status()).toBe(200);
    expect((await answer.json()).user).toBeTruthy();
    expect(answer.headers()['set-cookie'] ?? '').not.toContain('__Host-dhaaga_rt');
    await other.close();
  });

  test('log out everywhere asks first, then ends the session', async ({ page }) => {
    await page.goto('/en/login');
    await logIn(page, freshPhone());
    await page.goto('/en/account');
    await page.getByRole('button', { name: 'Log out everywhere' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Log out everywhere' }).click();
    await expect(page).toHaveURL(/\/en$/);
    await page.goto('/en/account');
    await expect(page).toHaveURL(/\/en\/login$/);
  });

  test('Hindi login, and a customer gets a real 403 in the Admin area', async ({ page }) => {
    await page.goto('/hi/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await logIn(page, freshPhone(), { phone: 'मोबाइल नंबर', send: 'कोड भेजें', code: 'कोड', verify: 'लॉग इन करें' });
    await expect(page).toHaveURL(/\/hi$/);
    const response = await page.goto('/hi/admin');
    expect(response?.status()).toBe(403);
    await expect(page.getByRole('heading', { name: 'आपके पास इस पेज की अनुमति नहीं है' })).toBeVisible();
  });

  test('a wrong code shows our message under the field and in a summary that takes focus; the backend wait drives "Send code again"', async ({ page }) => {
    const phone = freshPhone();
    await page.goto('/en/login');
    await page.getByLabel('Mobile number').fill(phone);
    await page.getByRole('button', { name: 'Send code' }).click();
    await readCode(phone);
    await page.getByLabel('Code', { exact: true }).fill('000000');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    const code = page.getByLabel('Code', { exact: true });
    await expect(code).toHaveAttribute('aria-invalid', 'true');
    await expect(code).toHaveAccessibleDescription(/That code isn't right/);
    const summary = page.getByRole('alert').filter({ hasText: 'Fix 1 thing to continue' });
    await expect(summary).toBeFocused();
    await summary.getByRole('link', { name: /That code isn't right/ }).click();
    await expect(code).toBeFocused();
    await expect(page.getByRole('button', { name: 'Send code again' })).toBeDisabled();
    await expect(page.getByText(/You can ask for a new code in \d+ seconds/)).toBeVisible();
  });
});

test.describe('session ends (Document 2, section 4)', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(90_000);

  test('ended elsewhere: the next page clears the cookies and says "Please log in again", then returns the person', async ({ page, context }) => {
    const phone = freshPhone();
    await page.goto('/en/login');
    await logIn(page, phone);
    // End the session at the backend without touching this browser's cookies (as a logout in another tab would).
    const { csrfToken } = (await (await page.request.get('/api/session')).json()) as { csrfToken: string };
    expect((await page.request.post('/api/auth/logout', { headers: { origin: 'https://localhost:3001', 'x-dhaaga-csrf': csrfToken } })).status()).toBe(200);
    expect((await context.cookies()).map((c) => c.name)).toContain('__Host-dhaaga_rt');

    await page.goto('/en/account');
    await expect(page).toHaveURL(/\/en\/login$/);
    await expect(page.getByRole('status').filter({ hasText: 'Please log in again.' })).toBeVisible();
    expect((await context.cookies()).map((c) => c.name)).not.toContain('__Host-dhaaga_rt');
    // The backend sends a new code to the same number only after its 30-second wait (OTP_RESEND_WAIT).
    await page.waitForTimeout(31_000);
    await logIn(page, phone);
    await expect(page).toHaveURL(/\/en\/account$/);
  });

  test('blocked: the blocked message instead of the login form', async ({ page }) => {
    const phone = freshPhone();
    await page.goto('/en/login');
    await logIn(page, phone);
    await blockUser(await backendLogin(process.env.E2E_ADMIN_PHONE ?? '9000000001'), phone);

    await page.goto('/en/account');
    await expect(page).toHaveURL(/\/en\/login$/);
    await expect(page.getByText('Please log in again.')).toBeVisible();
    // Logging in again (after the backend's 30-second wait for a new code): USER_BLOCKED, and the form gives way.
    await page.waitForTimeout(31_000);
    await page.getByLabel('Mobile number').fill(phone);
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByLabel('Code', { exact: true })).toBeFocused();
    await page.getByLabel('Code', { exact: true }).fill(await readCode(phone));
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'This account is blocked. Please contact support.' })).toBeVisible();
    await expect(page.getByLabel('Code', { exact: true })).toHaveCount(0);
  });

  test('a logged-in page is never stored in a shared cache (Document 2, section 5)', async ({ page }) => {
    await page.goto('/en/login');
    await logIn(page, freshPhone());
    const response = await page.goto('/en/account');
    const cacheControl = response?.headers()['cache-control'] ?? '';
    expect(cacheControl).toMatch(/private|no-store/);
    expect(cacheControl).not.toMatch(/s-maxage|public/);
  });
});

test.describe('form checks (D-04, D6-25; no backend needed)', () => {
  test('checked when leaving the field, cleared while typing a valid value, summary with focus on submit', async ({ page }) => {
    await page.goto('/en/login');
    const phone = page.getByLabel('Mobile number');
    await phone.fill('123');
    await expect(phone).not.toHaveAttribute('aria-invalid', 'true');
    await phone.blur();
    await expect(phone).toHaveAttribute('aria-invalid', 'true');
    await expect(phone).toHaveAccessibleDescription(/Enter a 10-digit mobile number/);
    await phone.fill('9876543210');
    await expect(phone).not.toHaveAttribute('aria-invalid', 'true');

    await phone.fill('');
    await page.getByRole('button', { name: 'Send code' }).click();
    const summary = page.getByRole('alert').filter({ hasText: 'Fix 1 thing to continue' });
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('link', { name: 'Enter your mobile number.' })).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  });

  test('Hindi messages for the same checks', async ({ page }) => {
    await page.goto('/hi/login');
    await page.getByRole('button', { name: 'कोड भेजें' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'आगे बढ़ने के लिए 1 चीज़ ठीक करें' })).toBeFocused();
    await expect(page.getByLabel('मोबाइल नंबर')).toHaveAccessibleDescription(/अपना मोबाइल नंबर लिखें/);
  });
});

test.describe('protections', () => {
  test('a change request from another site, or without the token, is refused', async ({ request }) => {
    const foreign = await request.post('/api/auth/code', { data: { phone: '9000000000' }, headers: { origin: 'https://evil.example' } });
    expect(foreign.status()).toBe(403);
    expect((await foreign.json()).error.code).toBe('ORIGIN_INVALID');

    const noToken = await request.post('/api/auth/code', { data: { phone: '9000000000' }, headers: { origin: 'https://localhost:3001' } });
    expect(noToken.status()).toBe(403);
    expect((await noToken.json()).error.code).toBe('CSRF_INVALID');
  });

  test('an after-login page outside our site is never kept', async ({ request }) => {
    const answer = await request.get('/en/login?next=//evil.example/x', { maxRedirects: 0 });
    expect(answer.status()).toBe(303);
    expect(answer.headers()['set-cookie'] ?? '').not.toContain('__Host-dhaaga_next');
  });

  test('public pages carry no Set-Cookie and do not change with login cookies (Document 2, section 5)', async ({ request }) => {
    const plain = await request.get('/en');
    expect(plain.headers()['set-cookie']).toBeUndefined();
    const withCookie = await request.get('/en', { headers: { cookie: '__Host-dhaaga_at=x; __Host-dhaaga_rt=y' } });
    expect(withCookie.headers()['set-cookie']).toBeUndefined();
    expect(await withCookie.text()).toBe(await plain.text());
  });

  test('the session answer is private and never cached', async ({ request }) => {
    const answer = await request.get('/api/session');
    expect(answer.headers()['cache-control']).toContain('no-store');
    const body = await answer.json();
    expect(body.user).toBeNull();
    expect(body.csrfToken).toMatch(/^p\./);
  });
});
