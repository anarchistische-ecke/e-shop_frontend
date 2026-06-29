import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
const port = process.env.PLAYWRIGHT_PORT || '3000';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://${host}:${port}`;
const useWebServer = process.env.PLAYWRIGHT_USE_WEBSERVER !== 'false';
const stagingAuthState = process.env.PLAYWRIGHT_STAGING_AUTH_STATE || 'test-results/.auth/staging-customer.json';
const focusedValidationSpecs = [
  /.*preprod-ux\.spec\.js/,
  /.*responsive-adaptability\.spec\.js/,
  /.*visual-regression\.spec\.js/,
];
const stagingSmokeSpecs = [/.*staging-smoke\.spec\.js/];

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chromium',
      testIgnore: stagingSmokeSpecs,
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
      },
    },
    {
      name: 'mobile-webkit',
      testMatch: focusedValidationSpecs,
      use: {
        ...devices['iPhone 15'],
        browserName: 'webkit',
      },
    },
    {
      name: 'desktop-chromium',
      testMatch: focusedValidationSpecs,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 960 },
        browserName: 'chromium',
      },
    },
    {
      name: 'staging-smoke',
      testMatch: stagingSmokeSpecs,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 960 },
        browserName: 'chromium',
        storageState: existsSync(stagingAuthState) ? stagingAuthState : undefined,
      },
    },
  ],
  webServer: useWebServer
    ? {
        command: 'npm start',
        env: {
          ...process.env,
          HOST: host,
          PORT: port,
          BROWSER: 'none',
          CI: 'true',
          REACT_APP_SITE_URL: baseURL,
          REACT_APP_KEYCLOAK_URL: '',
          REACT_APP_KEYCLOAK_REALM: '',
          REACT_APP_KEYCLOAK_CLIENT_ID: '',
        },
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : undefined,
});
