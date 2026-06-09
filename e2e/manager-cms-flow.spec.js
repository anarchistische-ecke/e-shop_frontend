const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createManagerToken() {
  return [
    base64Url({ alg: 'none', typ: 'JWT' }),
    base64Url({
      sub: 'manager-e2e',
      email: 'manager@example.test',
      name: 'Manager Test',
      preferred_username: 'manager@example.test',
      realm_access: { roles: ['manager'] },
      email_verified: true,
      amr: ['mfa'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
    'signature',
  ].join('.');
}

async function seedManagerSession(page) {
  await page.addInitScript((token) => {
    window.sessionStorage.setItem('authToken', token);
  }, createManagerToken());
}

async function mockManagerDashboard(page) {
  await page.route('**/managers/me/dashboard?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        stats: {
          totalSales: 0,
          averageOrderValue: 0,
          totalOrders: 0,
          paidOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
          refundedOrders: 0,
        },
        recentOrders: [],
      }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('manager login is the standalone staff entry point', async ({ page }) => {
  await page.goto('/manager/login');

  await expect(page.getByText('Вход менеджера')).toBeVisible();
  await expect(page.locator('header')).toHaveCount(0);
});

test('legacy admin urls hand off to manager login', async ({ page }) => {
  await page.goto('/admin/products');

  await page.waitForURL('**/manager/login');
  await expect(page.getByText('Вход менеджера')).toBeVisible();
});

test('manager account exposes Directus CMS actions', async ({ page }) => {
  await seedManagerSession(page);
  await mockManagerDashboard(page);

  await page.goto('/account#cms');

  await expect(page.getByRole('heading', { name: 'Управление витриной' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Открыть Storefront Ops' })).toHaveAttribute(
    'href',
    'http://localhost:8055/admin/storefront-ops'
  );
  await expect(page.getByRole('link', { name: 'Открыть Directus' })).toHaveAttribute(
    'href',
    'http://localhost:8055/admin'
  );
});
