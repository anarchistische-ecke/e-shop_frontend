const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('home page shows categories as a visible mobile list instead of a hidden slider', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Разделы каталога без скрытых свайпов/i })).toBeVisible();
  await expect(page.locator('a[href="/category/popular"]').first()).toBeVisible();
  await expect(page.locator('a[href="/category/new"]').first()).toBeVisible();

  await page.locator('a[href="/category/popular"]').first().click();

  await expect(page).toHaveURL(/\/category\/popular$/);
  await expect(page.getByRole('heading', { name: 'Популярное' })).toBeVisible();
});
