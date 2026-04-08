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

  const suggestionPanel = page.getByTestId('header-search-suggestions');
  await expect(suggestionPanel.getByText('Быстрые запросы').first()).toBeVisible();
  await expect(suggestionPanel.getByText('Категории').first()).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.getByTestId('header-search-suggestions')).toHaveCount(0);
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

test('header autocomplete can navigate directly to a category on mobile', async ({ page }) => {
  await page.goto('/');

  const searchInput = page.getByLabel('Поиск товаров');
  await searchInput.fill('Плед');

  const suggestionPanel = page.getByTestId('header-search-suggestions');
  await expect(suggestionPanel.getByText('Категории').first()).toBeVisible();
  await suggestionPanel.getByRole('link', { name: /Пледы/i }).first().click();

  await expect(page).toHaveURL(/\/category\/throws$/);
  await expect(page.getByRole('heading', { name: 'Пледы' })).toBeVisible();
});
