import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { KURTA_PHOTO } from './support/flows';
import { backendLog } from './support/login';
import { admin, approvedProduct, backend, staff, twoSizesAndColours } from './support/products';
import { nextRequestBody } from './support/requests';
import { MadeStatus, vendorIn } from './support/vendors';

/**
 * Slice 4c (Document 5, section 7.3; approved Stage 5, "Live version and revision"): an approved
 * product changes through a revision. The vendor proposes changes (details and photos), sees the
 * live version and the revision side by side, sends it for review, takes it back, and discards
 * one. The moderator decides on the moderation screen (Slice 5d, Document 5, 8.3): the revisions
 * queue, the live version and the revision side by side, then approve, or reject with a reason.
 * Against the real local backend; skipped where it is not running.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDE = { width: 1280, height: 900 };

async function noAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations).toEqual([]);
}

const toast = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });
const panel = (page: Page) => page.getByRole('region', { name: 'Live version and revision' });
/** A row of the comparison, by its field (wide screens draw a real table). */
const compared = (page: Page, field: string) =>
  panel(page)
    .getByRole('row')
    .filter({ has: page.getByRole('cell', { name: field, exact: true }) });

/** A new approved vendor with one approved product; returns the vendor's page and the product. */
async function approvedVendorProduct(browser: Browser, title: string) {
  const { page } = await vendorIn(browser, MadeStatus.Approved);
  await page.setViewportSize(WIDE);
  const { moderator } = await staff(browser);
  const { sizes, colours } = await twoSizesAndColours(page);
  const productId = await approvedProduct(page, moderator, title, [
    {
      sizeCode: sizes[0]?.code ?? '',
      colourCode: colours[0]?.code ?? '',
      pricePaise: 149900,
      stock: 3,
    },
  ]);
  return { page, moderator, productId };
}

/**
 * A moderator's decision on the revision, on the moderation screen: the product is in the
 * revisions queue, its review shows the changed field marked, then approve, or reject with a
 * reason.
 */
async function decide(
  moderator: Page,
  productId: string,
  decision: 'approve' | 'reject',
  changedField: string,
) {
  await moderator.setViewportSize(WIDE);
  await moderator.goto('/en/admin/moderation?queue=revision');
  await expect(moderator.getByRole('link', { name: 'Revisions' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await moderator.goto(`/en/admin/moderation/${productId}`);
  await expect(
    moderator.getByRole('heading', { name: 'Changes waiting for review' }),
  ).toBeVisible();
  await expect(
    moderator
      .getByRole('row')
      .filter({ has: moderator.getByRole('cell', { name: changedField, exact: true }) }),
  ).toContainText('Changed');
  await noAxeViolations(moderator);
  if (decision === 'approve') {
    // The same review in Hindi, before deciding.
    await moderator.goto(`/hi/admin/moderation/${productId}`);
    await expect(moderator.getByRole('heading', { name: 'समीक्षा के लिए बदलाव' })).toBeVisible();
    await moderator.goto(`/en/admin/moderation/${productId}`);
    await moderator.getByRole('button', { name: 'Approve changes' }).click();
    await expect(toast(moderator, 'Changes approved')).toBeVisible();
    return;
  }
  await moderator.getByRole('button', { name: 'Reject', exact: true }).click();
  const dialog = moderator.getByRole('alertdialog', { name: 'Reject these changes?' });
  await dialog.getByLabel(/^Reason/).fill('Keep the original title, please.');
  await dialog.getByRole('button', { name: 'Reject changes' }).click();
  await expect(toast(moderator, 'Changes rejected')).toBeVisible();
}

test.describe('revisions', () => {
  test.skip(!backendLog, 'needs the local backend (E2E_BACKEND_LOG)');
  test.setTimeout(180_000);

  test('propose a change, see it beside the live version, send it, take it back, and it goes live once approved', async ({
    browser,
  }) => {
    const title = `Revision kurta ${Date.now()}`;
    const { page, moderator, productId } = await approvedVendorProduct(browser, title);
    await page.goto(`/en/vendor/products/${productId}`);
    await expect(
      page.getByText('This product is live. Changes go through a revision.', { exact: false }),
    ).toBeVisible();
    await expect(panel(page).getByText('No changes proposed')).toBeVisible();
    await noAxeViolations(page);

    // The details start from the live product; only the changed title is sent.
    await panel(page).getByRole('button', { name: 'Propose changes' }).click();
    const titleField = panel(page).getByRole('textbox', { name: 'Title' });
    await expect(titleField).toHaveValue(title);
    await titleField.fill(`${title}, relaxed fit`);
    const sent = nextRequestBody(page, 'PATCH', /\/revision$/);
    await panel(page).getByRole('button', { name: 'Save changes' }).click();
    expect(await sent).toEqual({ title: `${title}, relaxed fit` });
    await expect(toast(page, 'Revision saved')).toBeVisible();

    // Side by side: the live title stays, the revision's is marked as changed.
    await expect(panel(page).getByText('Draft', { exact: true })).toBeVisible();
    const titleRow = compared(page, 'Title');
    await expect(titleRow).toContainText(title);
    await expect(titleRow).toContainText(`${title}, relaxed fit`);
    await expect(titleRow).toContainText('Changed');
    await expect(compared(page, 'Category')).not.toContainText('Changed');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await noAxeViolations(page);

    // A new photo is proposed, marked "New"; the live one is marked for removal, then kept.
    const chooser = page.waitForEvent('filechooser');
    await panel(page).getByRole('button', { name: 'Add a photo' }).click();
    await (await chooser).setFiles(KURTA_PHOTO);
    await expect(toast(page, 'Photo added')).toBeVisible();
    const photos = panel(page).getByRole('region', { name: 'Photos' });
    await expect(photos.getByText('New', { exact: true })).toBeVisible();
    await expect(compared(page, 'Photos')).toContainText('Added 1, removed 0');
    await photos.getByRole('button', { name: /^Remove\s*: Main photo$/ }).click();
    await expect(photos.getByText('Photos to be removed')).toBeVisible();
    await photos.getByRole('button', { name: 'Keep this photo' }).click();
    await expect(toast(page, 'Photo kept')).toBeVisible();
    await expect(photos.getByText('Photos to be removed')).toHaveCount(0);

    // Send it for review; while it waits it can only be taken back.
    await panel(page).getByRole('button', { name: 'Done editing' }).click();
    await panel(page).getByRole('button', { name: 'Send for review' }).click();
    await expect(toast(page, 'Revision sent for review')).toBeVisible();
    await expect(panel(page).getByText('Waiting for review', { exact: true })).toBeVisible();
    await expect(panel(page).getByRole('button', { name: 'Edit revision' })).toHaveCount(0);
    await panel(page).getByRole('button', { name: 'Withdraw' }).click();
    await expect(toast(page, 'Revision withdrawn. You can edit it again.')).toBeVisible();
    await expect(panel(page).getByText('Draft', { exact: true })).toBeVisible();

    // Sent again and approved: the live product now has the new title, and no revision is left.
    await panel(page).getByRole('button', { name: 'Send for review' }).click();
    await expect(panel(page).getByText('Waiting for review', { exact: true })).toBeVisible();
    await decide(moderator, productId, 'approve', 'Title');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${title}, relaxed fit`);
    await expect(panel(page).getByText('No changes proposed')).toBeVisible();
  });

  test('a rejected revision shows the reason, and discarding it asks first; a revision that changes nothing is refused', async ({
    browser,
  }) => {
    const title = `Rejected revision kurta ${Date.now()}`;
    const { page, moderator, productId } = await approvedVendorProduct(browser, title);
    await backend(page, 'PATCH', `/vendors/me/products/${productId}/revision`, {
      description: 'A softer cotton.',
    });
    await backend(page, 'POST', `/vendors/me/products/${productId}/revision/submit`);
    await decide(moderator, productId, 'reject', 'Description');

    await page.goto(`/en/vendor/products/${productId}`);
    await expect(panel(page).getByText('Rejected', { exact: true })).toBeVisible();
    await expect(panel(page).getByText('Keep the original title, please.')).toBeVisible();
    await expect(compared(page, 'Description')).toContainText('Changed');

    // Setting the description back leaves a revision that changes nothing: the backend refuses it.
    await panel(page).getByRole('button', { name: 'Edit revision' }).click();
    await panel(page)
      .getByRole('textbox', { name: 'Description (optional)', exact: true })
      .fill('');
    await panel(page).getByRole('button', { name: 'Save changes' }).click();
    await expect(toast(page, 'Revision saved')).toBeVisible();
    await panel(page).getByRole('button', { name: 'Send for review' }).click();
    await expect(
      panel(page).getByText(
        'The revision changes nothing yet. Change something before sending it for review.',
      ),
    ).toBeVisible();
    await noAxeViolations(page);

    // Discard asks first; then the live product is all there is.
    await panel(page).getByRole('button', { name: 'Discard revision' }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Discard this revision?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Discard revision' }).click();
    await expect(toast(page, 'Revision discarded')).toBeVisible();
    await expect(panel(page).getByText('No changes proposed')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  });

  test('a suspended vendor reads the revision and changes nothing; the panel in Hindi', async ({
    browser,
  }) => {
    const title = `Paused revision kurta ${Date.now()}`;
    const made = await approvedVendorProduct(browser, title);
    const { page, productId } = made;
    await backend(page, 'PATCH', `/vendors/me/products/${productId}/revision`, {
      title: `${title} II`,
    });
    const vendor = (await backend(page, 'GET', '/vendors/me')) as { id: string };
    await backend(await admin(browser), 'POST', `/admin/vendors/${vendor.id}/suspend`, {
      reason: 'Test: paused.',
    });
    await page.goto(`/en/vendor/products/${productId}`);
    await expect(compared(page, 'Title')).toContainText(`${title} II`);
    await expect(panel(page).getByRole('button')).toHaveCount(0);

    await page.goto(`/hi/vendor/products/${productId}`);
    await expect(page.getByRole('region', { name: 'लाइव संस्करण और संशोधन' })).toBeVisible();
    await expect(page.getByRole('table').getByText('बदला गया', { exact: true })).toBeVisible();
    await noAxeViolations(page);
  });
});
