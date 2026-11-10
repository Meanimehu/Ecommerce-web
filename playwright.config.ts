import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests on the engines behind the supported browsers, at a phone size and a desktop size (Document 7, D7-09).
 * A regression safety net only: WebKit here is not Safari; real browsers are checked by hand (D7-11).
 * They run over HTTPS (Document 7, section 17.1) through a test-only front on https://localhost:3001.
 *
 * PW_CHROMIUM_EXECUTABLE (optional) points Chromium at an already installed browser.
 * E2E_BACKEND_LOG (optional) is the local backend's log file; login tests read the mock SMS code from it and are
 * skipped without it.
 */
const chromiumPath = process.env.PW_CHROMIUM_EXECUTABLE;
const chromium = chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {};
const baseURL = process.env.E2E_BASE_URL ?? 'https://localhost:3001';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure', ignoreHTTPSErrors: true },
  projects: [
    { name: 'chromium-phone', use: { ...devices['Pixel 7'], ...chromium } },
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], ...chromium } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-phone', use: { ...devices['iPhone 15'] } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        { command: 'PORT=3002 npm start', url: 'http://127.0.0.1:3002/api/health', reuseExistingServer: !process.env.CI, timeout: 60000 },
        { command: 'node tests/e2e/support/https-front.mjs', url: `${baseURL}/api/health`, reuseExistingServer: !process.env.CI, timeout: 30000, ignoreHTTPSErrors: true },
      ],
});
