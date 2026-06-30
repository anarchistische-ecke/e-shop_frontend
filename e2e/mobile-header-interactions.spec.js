const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('mobile header search entry opens inline search', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Поиск' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('searchbox', { name: 'Поиск товаров' })).toBeFocused();
});

test('inline search submit navigates to search results on mobile', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Поиск' }).click();

  const searchInput = page.getByRole('searchbox', { name: 'Поиск товаров' });
  await searchInput.fill('Плед');
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/\/search\?query=/);
  expect(new URL(page.url()).searchParams.get('query')).toBe('Плед');
  await expect(page.getByRole('heading', { name: /Найдено/i })).toBeVisible();
});

test('inline search can navigate directly to a category on mobile', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Поиск' }).click();

  const searchInput = page.getByRole('searchbox', { name: 'Поиск товаров' });
  await searchInput.fill('Плед');

  const categorySuggestion = page.getByRole('link', { name: /Пледы/i }).first();
  await expect(categorySuggestion).toBeVisible();
  await categorySuggestion.click();

  await expect(page).toHaveURL(/\/category\/throws$/);
});
