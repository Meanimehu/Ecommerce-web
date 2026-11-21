import type { Browser } from '@playwright/test';
import { freshPhone, pageAs } from './login';
import { admin, backend } from './products';

/** The staff roles an admin may give (backend `role.enum.ts`, `ADMIN_GRANTABLE_ROLES`). */
export enum StaffRole {
  Admin = 'admin',
  Moderator = 'moderator',
  Support = 'support',
  Marketing = 'marketing',
  Finance = 'finance',
}

/**
 * A new person with these staff roles, logged in on a page of their own. The seeded test accounts
 * have only an admin and a moderator, so for any other role the person logs in once as a customer
 * (which makes their account), and the seeded admin gives the roles through the backend, as test
 * set-up only. The Users and roles screen (Slice 5b) is tested on its own. Returns the page, the
 * phone number and the user's id.
 */
export async function staffWith(browser: Browser, roles: readonly StaffRole[], path = '/en/admin') {
  const phone = freshPhone();
  const page = await pageAs(browser, phone, '/en/account');
  const adminPage = await admin(browser);
  const found = (await backend(adminPage, 'GET', `/admin/users?phone=${phone}`)) as {
    items: { id: string }[];
  };
  const id = found.items[0]?.id ?? '';
  for (const role of roles) {
    await backend(adminPage, 'POST', `/admin/users/${id}/roles`, { role });
  }
  await adminPage.context().close();
  await page.goto(path);
  return { page, phone, id };
}
