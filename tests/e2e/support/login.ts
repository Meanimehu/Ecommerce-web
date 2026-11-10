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

export async function logIn(page: Page, phone: string, labels = { phone: 'Mobile number', send: 'Send code', code: 'Code', verify: 'Log in' }) {
  await page.getByLabel(labels.phone).fill(phone);
  await page.getByRole('button', { name: labels.send }).click();
  await expect(page.getByLabel(labels.code, { exact: true })).toBeFocused();
  await page.getByLabel(labels.code, { exact: true }).fill(await readCode(phone));
  await page.getByRole('button', { name: labels.verify, exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
}
