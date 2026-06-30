const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('mobile header row opens the full catalog menu and bottom nav is absent', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('navigation', { name: 'Быстрая навигация' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Меню' }).click();

  const mobileMenu = page.getByTestId('mobile-nav-panel');
  await expect(mobileMenu).toBeVisible();
  await expect(mobileMenu.getByRole('link', { name: 'Весь каталог' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Перейти к поиску товаров и категорий' })).toBeVisible();
});

test('mobile header search opens inline suggestions and submits to search results', async ({ page }) => {
  await page.goto('/category/throws');

  await page.getByRole('button', { name: 'Поиск' }).click();
  const searchInput = page.getByRole('searchbox', { name: 'Поиск товаров' });
  await expect(searchInput).toBeFocused();
  await searchInput.fill('Плед');
  await expect(page.getByTestId('header-search-suggestions-mobile')).toBeVisible();
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/\/search\?query=/);
  await expect(page.getByRole('heading', { name: /Найдено/i })).toBeVisible();
});

test('mobile header row remains available on the magic-link login flow', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('navigation', { name: 'Быстрая навигация' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Меню' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Поиск' })).toBeVisible();
});

test('bottom navigation stays removed on product and checkout routes', async ({ page }) => {
  await page.goto('/product/prod-satin-sand/satin-sand');
  await expect(page.getByRole('navigation', { name: 'Быстрая навигация' })).toHaveCount(0);

  await page.goto('/checkout');
  await expect(page.getByRole('navigation', { name: 'Быстрая навигация' })).toHaveCount(0);
});
