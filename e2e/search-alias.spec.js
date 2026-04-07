const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('legacy /category/search alias redirects to canonical /catalog params', async ({ page }) => {
  await page.goto('/category/search?query=%D0%9F%D0%BB%D0%B5%D0%B4&scope=throws&brand=luna-soft');

  await expect(page).toHaveURL(/\/catalog\?query=.*scope=throws.*brand=luna-soft/);
  await expect(page.getByRole('heading', { name: 'Результаты поиска по всему каталогу' })).toBeVisible();
  await expect(page.getByText('Плед Cloud')).toBeVisible();
});
