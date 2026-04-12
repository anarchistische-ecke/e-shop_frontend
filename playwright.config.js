const { defineConfig, devices } = require('@playwright/test');

const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
const port = process.env.PLAYWRIGHT_PORT || '3000';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://${host}:${port}`;
const useWebServer = process.env.PLAYWRIGHT_USE_WEBSERVER !== 'false';

module.exports = defineConfig({
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
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
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
          REACT_APP_DELIVERY_INTEGRATION_ENABLED: 'false',
        },
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : undefined,
});
