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

  const mobileMenu = page.getByRole('dialog', { name: 'Меню каталога' });

  await expect(mobileMenu.getByText('Почему нам доверяют')).toBeVisible();

  const legalLink = mobileMenu.getByRole('link', {
    name: /Реквизиты и документы/i
  });
  await expect(legalLink).toBeVisible();

  await legalLink.click();

  await expect(page).toHaveURL(/\/info\/legal$/);
  await expect(page.getByRole('heading', { name: /Документы и регламенты/i })).toBeVisible();
});
