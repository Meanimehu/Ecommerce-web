import type { Page } from '@playwright/test';

/**
 * What the browser sends to our own endpoints, for tests that must check the request itself and
 * not only what the screen shows afterwards (Document 7, 20.12, item 8). A screen can say "Saved"
 * even when nothing was sent.
 */
const REQUEST_WAIT_MS = 10_000;

/**
 * The JSON body of the next request with this method to an address whose path matches `path`.
 * Start waiting before the click that sends it: `const sent = nextRequestBody(…); await click;
 * expect(await sent).toEqual(…)`. When no such request is sent, it fails after 10 seconds.
 */
export async function nextRequestBody(page: Page, method: string, path: RegExp): Promise<unknown> {
  const request = await page.waitForRequest(
    (candidate) => candidate.method() === method && path.test(new URL(candidate.url()).pathname),
    { timeout: REQUEST_WAIT_MS },
  );
  return request.postDataJSON();
}
