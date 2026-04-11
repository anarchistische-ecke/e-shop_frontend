const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('mobile menu exposes trust content within one tap', async ({ page }) => {
  await page.goto('/');

  await page
    .getByRole('navigation', { name: 'Быстрая навигация' })
    .getByRole('button', { name: 'Каталог' })
    .click();

  await expect(page.getByText('Почему нам доверяют')).toBeVisible();
  await expect(page.getByRole('link', { name: /Реквизиты и документы/i })).toBeVisible();

  await page.getByRole('link', { name: /Реквизиты и документы/i }).click();

  await expect(page).toHaveURL(/\/info\/legal$/);
  await expect(page.getByRole('heading', { name: /Документы и регламенты/i })).toBeVisible();
});
