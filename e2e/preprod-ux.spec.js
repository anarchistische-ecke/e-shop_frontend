const { test, expect } = require('@playwright/test');
const { publicOrder } = require('./fixtures/storefront');
const {
  createCustomerOrder,
  mockStorefrontApi,
} = require('./support/mockStorefrontApi');
const { seedCustomerSession } = require('./support/customerAuth');

async function completeCheckoutForm(page) {
  await page.getByLabel(/Электронная почта/i).fill('buyer@example.com');
  await page.getByLabel(/^Имя/i).fill('Иван Петров');
  await page.getByLabel(/^Телефон/i).fill('+79990000000');
  await page.locator('#checkout-form').getByRole('button', { name: 'К адресу' }).click();

  await page.getByLabel(/Домашний адрес/i).fill('Москва, Тестовая улица, 1');
  await page.locator('#checkout-form').getByRole('button', { name: 'К подтверждению' }).click();
}

test('wishlist persists to favorites and supports direct add-to-cart for single-variant products', async ({ page }) => {
  await mockStorefrontApi(page);

  await page.goto('/product/prod-towels-moss/towels-moss');
  await expect(page.getByRole('heading', { name: /Набор полотенец Лесной мох/i })).toBeVisible();

  await page.getByRole('button', { name: 'Добавить в избранное' }).first().click();
  await expect(page.getByRole('button', { name: 'Убрать из избранного' }).first()).toBeVisible();

  await page.goto('/favorites');
  await expect(page.getByRole('heading', { name: 'Сохранённые товары' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Набор полотенец Лесной мох/i }).first()).toBeVisible();

  await page.getByRole('button', { name: 'В корзину' }).first().click();
  await expect(page.getByText('Добавлено в корзину')).toBeVisible();

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Набор полотенец Лесной мох' })).toBeVisible();
});

test('cart checkout creates an embedded payment session and /pay/:token can request a new session', async ({ page }, testInfo) => {
  testInfo.storefrontApi = await mockStorefrontApi(page, {
    paymentProvider: {
      confirmationMode: 'EMBEDDED',
      checkoutDescription:
        'Оплата во встроенной защищённой форме ТестКасса. Данные карты не хранятся в браузере магазина.',
      resumePaymentLabel: 'Открыть форму оплаты через ТестКасса',
    },
    checkoutResponse: {
      order: publicOrder,
      payment: {
        paymentId: 'payment-e2e-checkout',
        confirmationType: 'EMBEDDED',
        confirmationToken: 'ct-e2e-checkout',
        confirmationUrl: '',
      },
    },
    payResponse: {
      paymentId: 'payment-e2e-pay',
      confirmationType: 'EMBEDDED',
      confirmationToken: 'ct-e2e-pay',
      confirmationUrl: '',
    },
  });

  await page.goto('/product/prod-satin-sand/satin-sand');
  await page.getByRole('button', { name: 'Добавить в корзину' }).click();
  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await page.getByRole('button', { name: 'Оформить заказ' }).click();
  await completeCheckoutForm(page);

  await page.locator('#checkout-form').getByRole('button', { name: 'Создать заказ и открыть форму оплаты' }).click();
  await expect(page).toHaveURL(new RegExp(`/order/${publicOrder.publicToken}$`));
  await expect(page.locator('[data-testid="mock-yookassa-widget"]')).toBeVisible();
  expect(testInfo.storefrontApi.stats.checkoutRequests).toBe(1);
  expect(testInfo.storefrontApi.stats.checkoutPayloads[0]).toMatchObject({
    receiptEmail: 'buyer@example.com',
    customerName: 'Иван Петров',
    confirmationMode: 'EMBEDDED',
  });

  await page.goto(`/pay/${publicOrder.publicToken}`);
  await expect(page.getByRole('heading', { name: 'Оплата заказа' })).toBeVisible();
  await page.getByRole('button', { name: /Оплатить/i }).first().click();
  await expect(page.locator('[data-testid="mock-yookassa-widget"]')).toBeVisible();
  expect(testInfo.storefrontApi.stats.publicPayRequests).toBe(1);
  expect(testInfo.storefrontApi.stats.publicPayPayloads[0]).toMatchObject({
    receiptEmail: 'buyer@example.com',
    confirmationMode: 'EMBEDDED',
  });
});

test('account reorder adds order items back to cart and RMA creation records selected items', async ({ page }, testInfo) => {
  const returnableOrder = createCustomerOrder();
  testInfo.storefrontApi = await mockStorefrontApi(page, {
    customerOrders: [returnableOrder],
  });
  await seedCustomerSession(page);

  await page.goto('/account#orders');
  await expect(page.getByRole('heading', { name: 'Мои заказы' })).toBeVisible();
  await expect(page.getByText(`Заказ ${String(returnableOrder.id).slice(0, 8)}...`).first()).toBeVisible();

  await page.getByRole('button', { name: 'Повторить заказ' }).first().click();
  await expect(page.getByText('Товары добавлены в корзину')).toBeVisible();
  expect(testInfo.storefrontApi.stats.addItemPayloads).toContainEqual({
    variantId: 'var-satin-sand-200',
    quantity: 1,
  });

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Песочный сатиновый комплект' })).toBeVisible();

  await page.goto('/account#orders');
  await page.getByRole('button', { name: 'Возврат' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Заявка на возврат' })).toBeVisible();

  await page.getByRole('checkbox').first().check();
  await page.getByLabel('Причина').fill('Не подошёл оттенок');
  await page.getByLabel('Желаемое решение').selectOption('Обмен');
  await page.getByRole('button', { name: 'Отправить заявку' }).click();

  await expect(page.getByText('Заявка на возврат создана')).toBeVisible();
  await expect(page.getByText('RMA-E2E-001')).toBeVisible();
  expect(testInfo.storefrontApi.stats.customerRmaCreateRequests).toBe(1);
  expect(testInfo.storefrontApi.stats.customerRmaPayloads[0]).toMatchObject({
    reason: 'Не подошёл оттенок',
    desiredResolution: 'Обмен',
    items: [{ orderItemId: 'order-item-1', quantity: 1 }],
  });
});
