const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('mobile menu search opens search results with mocked data', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await expect(page.getByText('Навигация')).toBeVisible();

  const searchInput = page.getByLabel('Поиск по каталогу');
  await searchInput.fill('Плед');
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/\/catalog\?query=/);
  await expect(page.getByRole('heading', { name: 'Результаты поиска по всему каталогу' })).toBeVisible();
  await expect(page.getByText('Плед Cloud')).toBeVisible();
});
