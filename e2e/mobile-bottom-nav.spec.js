const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('bottom navigation opens the full mobile catalog menu', async ({ page }) => {
  await page.goto('/');

  const bottomNav = page.getByRole('navigation', { name: 'Быстрая навигация' });
  await expect(bottomNav).toBeVisible();

  const catalogButton = bottomNav.getByRole('button', { name: 'Каталог' });
  await catalogButton.focus();
  await page.keyboard.press('Enter');

  const mobileMenu = page.getByTestId('mobile-nav-panel');
  await expect(mobileMenu).toBeVisible();
  await expect(mobileMenu.getByRole('link', { name: 'Весь каталог' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Перейти к поиску товаров и категорий' })).toBeVisible();
});

test('bottom navigation opens the dedicated mobile search page', async ({ page }) => {
  await page.goto('/category/throws');

  const bottomNav = page.getByRole('navigation', { name: 'Быстрая навигация' });
  await bottomNav.getByRole('button', { name: 'Поиск' }).tap();

  await expect(page).toHaveURL(/\/search/);

  const searchInput = page.getByLabel('Что ищем');
  await expect(searchInput).toBeFocused();
  await searchInput.fill('Плед');
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/\/search\?query=/);
  await expect(page.getByRole('heading', { name: /Найдено/i })).toBeVisible();
});

test('bottom navigation remains visible on the customer login/account flow', async ({ page }) => {
  await page.goto('/login');

  const bottomNav = page.getByRole('navigation', { name: 'Быстрая навигация' });
  await expect(bottomNav).toBeVisible();
  await expect(bottomNav.getByRole('link', { name: 'Войти' })).toBeVisible();
});

test('bottom navigation stays hidden on product and checkout routes', async ({ page }) => {
  await page.goto('/product/prod-satin-sand/satin-sand');
  await expect(page.getByRole('navigation', { name: 'Быстрая навигация' })).toHaveCount(0);

  await page.goto('/checkout');
  await expect(page.getByRole('navigation', { name: 'Быстрая навигация' })).toHaveCount(0);
});
