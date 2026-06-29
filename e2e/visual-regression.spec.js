const { test, expect } = require('@playwright/test');
const { publicOrder } = require('./fixtures/storefront');
const {
  createCustomerOrder,
  mockStorefrontApi,
} = require('./support/mockStorefrontApi');
const { seedCustomerSession } = require('./support/customerAuth');

async function stabilizeVisuals(page) {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
      .reveal-up {
        opacity: 1 !important;
        transform: none !important;
      }
    `,
  });
  await page.evaluate(() => document.fonts?.ready || Promise.resolve());
  await page.waitForTimeout(150);
}

async function expectStableScreenshot(page, name) {
  await stabilizeVisuals(page);
  await expect(page).toHaveScreenshot(name, {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.02,
  });
}

async function expectStableElementScreenshot(page, locator, name) {
  await stabilizeVisuals(page);
  await expect(locator).toHaveScreenshot(name, {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.02,
  });
}

test('home, catalog, and category visual states stay stable', async ({ page }) => {
  await mockStorefrontApi(page);

  await page.goto('/');
  await expect(page.getByTestId('home-hero')).toBeVisible();
  await expectStableScreenshot(page, 'home.png');

  await page.goto('/catalog');
  await expect(page.getByTestId('catalogue-search-card')).toBeVisible();
  await expectStableScreenshot(page, 'catalog.png');

  await page.goto('/category/popular');
  await expect(page.getByRole('heading', { name: 'Популярное' })).toBeVisible();
  await expectStableScreenshot(page, 'category-popular.png');
});

test('product wishlist and favorites visual states stay stable', async ({ page }) => {
  await mockStorefrontApi(page);

  await page.goto('/product/prod-satin-sand/satin-sand');
  await expect(page.getByRole('heading', { name: /Песочный сатиновый комплект/i })).toBeVisible();
  await page.getByRole('button', { name: 'Добавить в избранное' }).first().click();
  await expectStableScreenshot(page, 'product-wishlisted.png');

  await page.goto('/favorites');
  await expect(page.getByRole('heading', { name: 'Сохранённые товары' })).toBeVisible();
  await expectStableScreenshot(page, 'favorites.png');
});

test('cart, checkout, and pay route visual states stay stable', async ({ page }) => {
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
        paymentId: 'payment-e2e-checkout',
        confirmationType: 'EMBEDDED',
        confirmationToken: 'ct-e2e-checkout',
        confirmationUrl: '',
      },
    },
  });

  await page.goto('/product/prod-satin-sand/satin-sand');
  await page.getByRole('button', { name: 'Добавить в корзину' }).click();

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Ваши товары для уюта' })).toBeVisible();
  await expectStableScreenshot(page, 'cart.png');

  await page.getByRole('button', { name: 'Оформить заказ' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: /Быстрое оформление без лишних шагов/i })).toBeVisible();
  await expectStableScreenshot(page, 'checkout.png');

  await page.goto(`/pay/${publicOrder.publicToken}`);
  await expect(page.getByRole('heading', { name: 'Оплата заказа' })).toBeVisible();
  await expectStableScreenshot(page, 'pay-token.png');
});

test('account orders and RMA modal visual state stays stable', async ({ page }) => {
  await mockStorefrontApi(page, {
    customerOrders: [createCustomerOrder()],
  });
  await seedCustomerSession(page);

  await page.goto('/account#orders');
  await expect(page.getByRole('heading', { name: 'Мои заказы' })).toBeVisible();
  await page.getByRole('button', { name: 'Возврат' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Заявка на возврат' });
  await expect(dialog).toBeVisible();
  await expectStableElementScreenshot(page, dialog, 'account-rma-modal.png');
});
