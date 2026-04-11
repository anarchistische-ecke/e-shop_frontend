const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('mobile menu search link opens search results with mocked data', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await expect(page.getByText('Навигация')).toBeVisible();

  await page.getByRole('link', { name: 'Перейти к поиску товаров и категорий' }).click();

  const searchInput = page.getByLabel('Что ищем');
  await searchInput.fill('Плед');
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/\/search\?query=/);
  await expect(page.getByRole('heading', { name: /Найдено/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Плед Cloud/i })).toBeVisible();
});

test('mobile menu exposes nested categories from the catalog navigation', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Открыть меню' }).click();
  const mobileMenu = page.getByTestId('mobile-nav-panel');
  await expect(mobileMenu.getByRole('button', { name: /Популярное/i })).toBeVisible();

  await mobileMenu.getByRole('button', { name: /Популярное/i }).click();
  await expect(mobileMenu.getByRole('link', { name: /Смотреть всё: Популярное/i })).toBeVisible();
  await expect(
    mobileMenu.getByRole('link', { name: /Сатин Комплекты сатинового белья/i })
  ).toBeVisible();
});
