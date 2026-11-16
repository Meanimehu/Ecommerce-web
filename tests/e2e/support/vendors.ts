import { expect, type Browser, type Page } from '@playwright/test';
import { TEST_PDF } from './files';
import { freshPhone, pageAs } from './login';
import { admin, backend, BACKEND } from './products';

/**
 * Test set-up only: a new person with a vendor in the status a test needs, made by calling the
 * backend directly (the application screens have their own spec). Returns the person's page, logged
 * in, and what was made.
 */
export enum MadeStatus {
  Submitted = 'submitted',
  Approved = 'approved',
  Suspended = 'suspended',
}

export type MadeVendor = {
  page: Page;
  phone: string;
  id: string;
  shop: string;
  email: string;
};

const tokenOf = async (page: Page) =>
  (await page.context().cookies()).find((cookie) => cookie.name === '__Host-dhaaga_at')?.value ??
  '';

export async function vendorIn(
  browser: Browser,
  status: MadeStatus,
  path = '/en/account',
): Promise<MadeVendor> {
  const phone = freshPhone();
  const shop = `Profile Weaves ${phone.slice(-5)}`;
  const email = `owner${phone.slice(-5)}@example.com`;
  const page = await pageAs(browser, phone, path);
  const applied = (await backend(page, 'POST', '/vendors/apply', {
    legalName: `${shop} Proprietorship`,
    displayName: shop,
    sellerType: 'proprietorship',
    contactEmail: email,
  })) as { id: string };
  await backend(page, 'POST', '/vendors/me/addresses', {
    type: 'pickup',
    line1: '12 MG Road',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    contactPhone: phone,
  });
  const file = new FormData();
  file.append('type', 'pan');
  file.append('file', new Blob([TEST_PDF], { type: 'application/pdf' }), 'pan.pdf');
  const upload = await fetch(`${BACKEND}/vendors/me/documents`, {
    method: 'POST',
    headers: { authorization: `Bearer ${await tokenOf(page)}` },
    body: file,
  });
  expect(upload.status).toBe(201);
  const pan = (await upload.json()) as { id: string };
  const mine = (await backend(page, 'GET', '/vendors/me')) as { requiredTermsVersion: string };
  await backend(page, 'POST', '/vendors/me/submit', { termsVersion: mine.requiredTermsVersion });

  if (status !== MadeStatus.Submitted) {
    const adminPage = await admin(browser);
    await backend(adminPage, 'POST', `/admin/vendors/${applied.id}/documents/${pan.id}/approve`);
    await backend(adminPage, 'POST', `/admin/vendors/${applied.id}/approve`);
    if (status === MadeStatus.Suspended) {
      await backend(adminPage, 'POST', `/admin/vendors/${applied.id}/suspend`, {
        reason: 'Test: paused while documents are checked.',
      });
    }
  }
  return { page, phone, id: applied.id, shop, email };
}
