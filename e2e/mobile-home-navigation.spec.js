const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('home page shows categories as a visible mobile list instead of a hidden slider', async ({ page }) => {
  await page.goto('/');

  const categorySection = page.getByTestId('home-category-grid');
  await expect(
    categorySection.getByRole('heading', { name: /Разделы каталога без скрытых свайпов/i })
  ).toBeVisible();
  await expect(categorySection.getByRole('link', { name: 'Весь каталог' })).toHaveCount(0);
  await expect(categorySection.locator('.overflow-x-auto')).toHaveCount(0);

  const categoryLinks = categorySection.locator('a[href^="/category/"]');
  await expect(categoryLinks.first()).toBeVisible();
  expect(await categoryLinks.count()).toBeGreaterThanOrEqual(3);

  await categoryLinks.first().click();

  await expect(page).toHaveURL(/\/category\/.+$/);
  await expect(page.locator('h1').first()).toBeVisible();
});
