const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('header search suggestions close on escape on mobile', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Бестселлеры недели' })
  ).toBeVisible();

  const searchInput = page.getByLabel('Поиск товаров');
  await searchInput.fill('Сатин');

  await expect(page.getByText('Подсказки поиска').first()).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.getByText('Подсказки поиска')).toHaveCount(0);
});

test('header search submit navigates to search results on mobile', async ({ page }) => {
  await page.goto('/');

  const searchInput = page.getByLabel('Поиск товаров');
  await searchInput.fill('Плед');
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/\/catalog\?query=/);
  expect(new URL(page.url()).searchParams.get('query')).toBe('Плед');
  await expect(page.getByRole('heading', { name: 'Результаты поиска по всему каталогу' })).toBeVisible();
});
