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
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');

  await page.getByRole('link', { name: 'Песочный сатиновый комплект' }).first().click();
  const deliveryLink = { name: 'Уточнить доставку до оплаты', exact: true };
  const deliveryPath = '/info/delivery#delivery-contact';
  const productQuote = page.getByRole('link', deliveryLink);
  await expect(productQuote).toHaveAttribute('href', deliveryPath);
  await expect(productQuote).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: 'Добавить в корзину' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  const cartQuote = page.getByTestId('mobile-cart-checkout-bar').getByRole('link', deliveryLink);
  await expect(cartQuote).toHaveAttribute('href', deliveryPath);
  await expect(cartQuote).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: 'Оформить заказ', exact: true }).click();
  await expect(page.getByText('Оформление без аккаунта')).toBeVisible();
  const checkoutQuote = page.getByRole('link', deliveryLink).first();
  await expect(checkoutQuote).toHaveAttribute('href', deliveryPath);
  await expect(checkoutQuote).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('list', { name: 'Прогресс оформления заказа' }).locator('[aria-current="step"]')).toContainText('Контакты и адрес');

  await page.getByLabel(/Электронная почта/i).fill('buyer@example.com');
  await page.getByLabel(/^Имя/i).fill('Иван Петров');
  await page.getByLabel(/^Телефон/i).fill('+79990000000');
  await page.getByLabel(/Город/i).fill('Москва');
  await page.getByLabel(/Улица, дом/i).fill('Тестовая улица, 1');
  await expect(
    page.locator('#checkout-form').getByText(/Доставка оплачивается отдельно после расчёта менеджером/i)
  ).toBeVisible();
  await page.getByLabel(/Улица, дом/i).press('Enter');
  await expect(page.getByRole('list', { name: 'Прогресс оформления заказа' }).locator('[aria-current="step"]')).toContainText('Проверка и оплата');
  await expect(page.locator('#checkout-review-title')).toBeFocused();

  const reviewAction = { name: 'Перейти к оплате', exact: true };
  const inFlowAction = page.locator('#checkout-form').getByRole('button', reviewAction);
  const stickyAction = page.locator('.checkout-mobile-action').getByRole('button', reviewAction);

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(stickyAction).toBeInViewport({ ratio: 1 });
  await inFlowAction.evaluate((action) => action.scrollIntoView({ block: 'center' }));
  await expect(inFlowAction).toBeInViewport({ ratio: 1 });
  await expect(stickyAction).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await stickyAction.click();

  await expect(page).toHaveURL(/\/account\?order=order-e2e-1#orders$/);
  await expect(page.getByText('Защищённая форма оплаты')).toBeVisible();
  await expect(page.locator('[data-testid="mock-yookassa-widget"]')).toBeVisible();

  await page.locator('[data-testid="mock-yookassa-pay-button"]').click();

  await expect(page).toHaveURL(/\/account\?order=order-e2e-1#orders$/);
  await expect(page.getByRole('heading', { name: 'Ваш заказ' })).toBeVisible();
});
