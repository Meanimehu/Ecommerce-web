import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

/**
 * Login through the real login page against the local backend. The backend's SMS is a mock that writes the code to
 * its log (backend README; mock-sms.provider.ts), so the test reads it from E2E_BACKEND_LOG.
 */
export const backendLog = process.env.E2E_BACKEND_LOG;

/** A phone number no other test uses (backend limit: 5 codes an hour per number). */
export function freshPhone(): string {
  return `9${String(Date.now()).slice(-6)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
}

export async function readCode(phone: string): Promise<string> {
  const last4 = phone.slice(-4);
  for (let i = 0; i < 50; i++) {
    const lines = readFileSync(backendLog ?? '', 'utf8').split('\n').filter((l) => l.includes('[MOCK SMS]') && l.includes(`******${last4}`));
    const match = /code is (\d{6})/.exec(lines.at(-1) ?? '');
    if (match?.[1]) return match[1];
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`No login code for ${phone} in ${backendLog}`);
}

export async function logIn(page: Page, phone: string, labels = { phone: 'Mobile number', send: 'Send code', code: 'One-time code', verify: 'Verify and log in' }) {
  await page.getByLabel(labels.phone).fill(phone);
  await page.getByRole('button', { name: labels.send }).click();
  await expect(page.getByLabel(labels.code, { exact: true })).toBeFocused();
  await page.getByLabel(labels.code, { exact: true }).fill(await readCode(phone));
  await page.getByRole('button', { name: labels.verify, exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
}

/** Calls the backend directly, as staff, for test set-up only (for example blocking a test user). */
const backendUrl = process.env.E2E_BACKEND_URL ?? 'http://localhost:3000';

export async function backendLogin(phone: string): Promise<string> {
  const request = await fetch(`${backendUrl}/api/v1/auth/otp/request`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone }) });
  if (!request.ok && request.status !== 429) throw new Error(`code request failed: ${request.status}`);
  const code = await readCode(phone);
  const verify = await fetch(`${backendUrl}/api/v1/auth/otp/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, code }) });
  if (!verify.ok) throw new Error(`verify failed: ${verify.status}`);
  return ((await verify.json()) as { accessToken: string }).accessToken;
}

/** Ends a session at the backend without touching the browser's cookies (as a logout in another tab would). */
export async function backendLogout(accessToken: string): Promise<void> {
  const answer = await fetch(`${backendUrl}/api/v1/auth/logout`, { method: 'POST', headers: { authorization: `Bearer ${accessToken}` } });
  if (answer.status !== 204) throw new Error(`logout failed: ${answer.status}`);
}

export async function blockUser(adminToken: string, phone: string): Promise<void> {
  const auth = { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' };
  const found = await fetch(`${backendUrl}/api/v1/admin/users?phone=${phone}`, { headers: auth });
  const user = ((await found.json()) as { items: { id: string }[] }).items[0];
  if (!user) throw new Error(`no user ${phone}`);
  const blocked = await fetch(`${backendUrl}/api/v1/admin/users/${user.id}/block`, { method: 'POST', headers: auth, body: JSON.stringify({ reason: 'End-to-end test of the blocked-account message' }) });
  if (!blocked.ok) throw new Error(`block failed: ${blocked.status}`);
}
