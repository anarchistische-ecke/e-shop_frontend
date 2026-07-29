const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test('newsletter requires consent and confirms through a token-clean URL', async ({ page }) => {
  const api = await mockStorefrontApi(page);
  await page.goto('/#newsletter');

  await page.getByLabel('Электронная почта для рассылки').fill('buyer@example.com');
  await page.getByRole('button', { name: 'Подписаться' }).click();
  await expect(page.getByText(/Подтвердите согласие/i)).toBeVisible();

  await page.getByText(/Я согласен/i).click();
  await page.getByRole('button', { name: 'Подписаться' }).click();
  await expect(page.getByText(/Проверьте почту/i)).toBeVisible();
  expect(api.stats.newsletterRequests).toBe(1);

  await page.goto('/subscribe/confirm?token=test-confirmation-token');
  await expect(page).toHaveURL(/\/subscribe\/confirm$/);
  await expect(page.getByText(/Подписка подтверждена/i)).toBeVisible();
});
