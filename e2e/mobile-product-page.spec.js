const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test('buy now submits once on a slow mobile connection', async ({ page }) => {
  const { cartState, stats } = await mockStorefrontApi(page, { addItemDelayMs: 700 });

  await page.goto('/product/prod-satin-sand');
  await expect(page.getByRole('heading', { name: /Сатиновый комплект Sand/i })).toBeVisible();

  const buyNowButton = page.getByRole('button', { name: 'Купить сейчас' });
  await buyNowButton.dblclick();

  await expect(page.getByRole('button', { name: 'Переходим к оформлению…' })).toBeDisabled();
  await expect(page).toHaveURL(/\/checkout$/);

  expect(stats.addItemRequests).toBe(1);
  expect(cartState.items).toHaveLength(1);
  expect(cartState.items[0].quantity).toBe(1);
});

test('out-of-stock variant disables purchase CTAs and hides fake notify form', async ({ page }) => {
  await mockStorefrontApi(page);

  await page.goto('/product/prod-satin-sand');
  await expect(page.getByRole('heading', { name: /Сатиновый комплект Sand/i })).toBeVisible();

  await page.getByRole('button', { name: /240×260/i }).click();

  await expect(page.getByText('Нет в наличии для выбранного варианта').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Добавить в корзину' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Купить сейчас' })).toBeDisabled();
  await expect(page.getByText('Этот вариант сейчас недоступен')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Выбрать доступный вариант' })).toBeVisible();
  await expect(page.getByLabel('Email для уведомления')).toHaveCount(0);
});
