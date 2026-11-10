import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests on the engines behind the supported browsers, at a phone size and a desktop size (Document 7, D7-09).
 * They are a regression safety net only: WebKit here is not Safari, and real-browser checks are done by hand (D7-11).
 *
 * PW_CHROMIUM_EXECUTABLE (optional) points Chromium at an already installed browser, for machines where
 * `npx playwright install` cannot run.
 */
const chromiumPath = process.env.PW_CHROMIUM_EXECUTABLE;
const chromium = chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {};
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium-phone', use: { ...devices['Pixel 7'], ...chromium } },
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], ...chromium } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-phone', use: { ...devices['iPhone 15'] } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm start', url: `${baseURL}/api/health`, reuseExistingServer: !process.env.CI, timeout: 60000 },
});
