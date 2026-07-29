const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test('public commerce surfaces never request the full product directory', async ({ page }) => {
  const api = await mockStorefrontApi(page);

  await page.goto('/');
  await page.goto('/category/popular');
  await page.goto('/product/prod-satin-sand/satin-sand');
  await page.getByRole('button', { name: 'Добавить в избранное' }).first().click();
  await page.getByRole('button', { name: 'Добавить в корзину' }).click();
  await page.goto('/favorites');
  await expect(page.getByRole('heading', { name: 'Сохранённые товары' })).toBeVisible();
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: /Ваши товары/i })).toBeVisible();

  expect(api.stats.fullProductsRequests).toBe(0);
});
