const { test, expect } = require('@playwright/test');
const { publicOrder } = require('./fixtures/storefront');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page, {
    paymentProvider: {
      confirmationMode: 'EMBEDDED',
      checkoutDescription:
        'Оплата во встроенной защищённой форме ТестКасса. Данные карты не хранятся в браузере магазина.',
      resumePaymentLabel: 'Открыть форму оплаты через ТестКасса',
    },
    checkoutResponse: {
      order: publicOrder,
      payment: {
        paymentId: 'payment-e2e-embedded',
        confirmationType: 'EMBEDDED',
        confirmationToken: 'ct-e2e-embedded',
        confirmationUrl: '',
      },
    },
    payResponse: {
      paymentId: 'payment-e2e-retry',
      confirmationType: 'EMBEDDED',
      confirmationToken: 'ct-e2e-retry',
      confirmationUrl: '',
    },
  });
});

test('customer can open embedded payment inside the SPA and return to the saved order', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Песочный сатиновый комплект' }).first().click();
  await page.getByRole('button', { name: 'Добавить в корзину' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await page.getByRole('button', { name: 'Оформить заказ', exact: true }).click();

  await page.getByLabel(/Электронная почта/i).fill('buyer@example.com');
  await page.getByLabel(/^Имя/i).fill('Иван Петров');
  await page.getByLabel(/^Телефон/i).fill('+79990000000');
  await page.getByLabel(/Город/i).fill('Москва');
  await page.getByLabel(/Улица, дом/i).fill('Тестовая улица, 1');
  await expect(
    page.locator('#checkout-form').getByText(/Доставка оплачивается отдельно после расчёта менеджером/i)
  ).toBeVisible();
  await page.locator('#checkout-form').getByRole('button', { name: 'Проверить заказ' }).click();

  await page.locator('#checkout-form').getByRole('button', { name: 'Создать заказ и открыть форму оплаты' }).click();

  await expect(page).toHaveURL(/\/account\?order=order-e2e-1#orders$/);
  await expect(page.getByText('Защищённая форма оплаты')).toBeVisible();
  await expect(page.locator('[data-testid="mock-yookassa-widget"]')).toBeVisible();

  await page.locator('[data-testid="mock-yookassa-pay-button"]').click();

  await expect(page).toHaveURL(/\/account\?order=order-e2e-1#orders$/);
  await expect(page.getByRole('heading', { name: 'Ваш заказ' })).toBeVisible();
});
