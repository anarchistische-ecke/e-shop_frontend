const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('mobile catalogue filters narrow results without layout regressions', async ({ page }) => {
  await page.goto('/catalog');

  await expect(page.getByRole('heading', { name: 'Подбор текстиля без лишних кликов' })).toBeVisible();

  await page.getByRole('button', { name: 'Все фильтры' }).click();
  await expect(page.getByRole('heading', { name: 'Уточните выбор' })).toBeVisible();

  await page.getByRole('button', { name: 'Только в наличии' }).click();
  await page.getByRole('button', { name: 'Со скидкой' }).click();
  await page.getByRole('button', { name: 'Показать товары' }).click();

  await expect(page.getByText('Сатиновый комплект Sand')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Только в наличии' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Со скидкой' })).toBeVisible();
  await expect(page.getByText('Плед Cloud')).toHaveCount(0);
  await expect(page.getByText('Набор полотенец Moss')).toHaveCount(0);
});
