const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('mobile header search entry opens the dedicated search page', async ({ page }) => {
  await page.goto('/');

  const searchEntry = page.getByRole('link', { name: 'Открыть страницу поиска' });
  await searchEntry.click();

  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByLabel('Что ищем')).toBeFocused();
});

test('search page submit navigates to search results on mobile', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Открыть страницу поиска' }).click();

  const searchInput = page.getByLabel('Что ищем');
  await searchInput.fill('Плед');
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/\/search\?query=/);
  expect(new URL(page.url()).searchParams.get('query')).toBe('Плед');
  await expect(page.getByRole('heading', { name: /Найдено/i })).toBeVisible();
});

test('search page can navigate directly to a category on mobile', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Открыть страницу поиска' }).click();

  const searchInput = page.getByLabel('Что ищем');
  await searchInput.fill('Плед');
  await searchInput.press('Enter');

  const scopeChip = page.getByRole('button', { name: 'Пледы' }).first();
  await expect(scopeChip).toBeVisible();
  await scopeChip.click();

  await expect(page).toHaveURL(/\/search\?query=.*scope=throws/);
  await expect(page.getByText('Запрос:')).toBeVisible();
});
