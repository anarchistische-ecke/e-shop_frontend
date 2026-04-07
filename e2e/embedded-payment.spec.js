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

test('customer can open embedded payment inside the SPA and return to the order page', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: /Сатиновый комплект Sand/i }).first().click();
  await page.getByRole('button', { name: 'Добавить в корзину' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await page.getByRole('button', { name: 'Оформить заказ' }).click();

  await page.getByLabel(/Электронная почта/i).fill('buyer@example.com');
  await page.locator('#checkout-form').getByRole('button', { name: /^Продолжить$/ }).click();

  await page.getByLabel(/^Имя/i).fill('Иван');
  await page.getByLabel(/^Телефон/i).fill('+79990000000');
  await page.locator('#checkout-form').getByRole('button', { name: /^Продолжить$/ }).click();

  await page.getByLabel(/Адрес доставки/i).fill('Москва, Тестовая улица, 1');
  await page.locator('#checkout-form').getByRole('button', { name: 'Рассчитать' }).click();
  await expect(page.getByText(/Курьер/i).first()).toBeVisible();
  await page.locator('#checkout-form').getByRole('button', { name: /^Продолжить$/ }).click();

  await page.locator('#checkout-form').getByRole('button', { name: 'Создать заказ и открыть форму оплаты' }).click();

  await expect(page).toHaveURL(new RegExp(`/order/${publicOrder.publicToken}$`));
  await expect(page.getByText('Защищённая форма оплаты')).toBeVisible();
  await expect(page.locator('[data-testid="mock-yookassa-widget"]')).toBeVisible();

  await page.locator('[data-testid="mock-yookassa-pay-button"]').click();

  await expect(page).toHaveURL(new RegExp(`/order/${publicOrder.publicToken}$`));
  await expect(page.getByRole('heading', { name: /Заказ №/i })).toBeVisible();
});
