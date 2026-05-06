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

test('mobile product page keeps gallery controls above the sticky cart bar and surfaces purchase info first', async ({ page }) => {
  await mockStorefrontApi(page);

  await page.goto('/product/prod-satin-sand');
  await expect(page.getByRole('heading', { name: /Сатиновый комплект Sand/i })).toBeVisible();

  const galleryRail = page.getByTestId('product-gallery-rail');
  const stickyBar = page.getByTestId('product-mobile-cart-bar');
  const purchaseCard = page.getByTestId('product-purchase-card');
  const mobileHighlights = page.getByTestId('product-mobile-highlights');

  await expect(galleryRail).toBeVisible();
  await expect(stickyBar).toBeVisible();
  await expect(purchaseCard).toBeVisible();
  await expect(mobileHighlights).toBeVisible();

  const [railBox, stickyBox, purchaseBox, highlightsBox] = await Promise.all([
    galleryRail.boundingBox(),
    stickyBar.boundingBox(),
    purchaseCard.boundingBox(),
    mobileHighlights.boundingBox(),
  ]);

  expect(railBox).not.toBeNull();
  expect(stickyBox).not.toBeNull();
  expect(purchaseBox).not.toBeNull();
  expect(highlightsBox).not.toBeNull();

  expect(railBox.y).toBeLessThan(stickyBox.y);
  expect(railBox.y).toBeLessThan(purchaseBox.y);
  expect(purchaseBox.y).toBeLessThan(highlightsBox.y);
});

test('mobile gallery swipes between images and still opens zoom on tap', async ({ page }) => {
  await mockStorefrontApi(page);

  await page.goto('/product/prod-satin-sand');
  await expect(page.getByRole('heading', { name: /Сатиновый комплект Sand/i })).toBeVisible();

  const galleryButton = page
    .getByTestId('product-gallery-card')
    .locator('button[aria-label="Увеличить изображение"]')
    .first();
  await expect(galleryButton).toBeVisible();

  const box = await galleryButton.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.18, box.y + box.height * 0.5, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByRole('button', { name: 'Показать изображение 2' })).toHaveAttribute('aria-current', 'true');

  await galleryButton.click();
  await expect(page.getByTestId('product-media-viewer')).toBeVisible();
  await expect(page.getByTestId('product-media-counter')).toHaveText('2 / 3');
});

test('out-of-stock variant disables purchase CTAs and hides fake notify form', async ({ page }) => {
  await mockStorefrontApi(page);

  await page.goto('/product/prod-satin-sand');
  await expect(page.getByRole('heading', { name: /Сатиновый комплект Sand/i })).toBeVisible();

  await page.getByLabel('Выберите вариант').click();
  await page.getByRole('option', { name: /240×260/ }).click();

  await expect(page.getByText('Нет в наличии для выбранного варианта').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Добавить в корзину' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Купить сейчас' })).toBeDisabled();
  await expect(page.getByText('Этот вариант сейчас недоступен')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Выбрать доступный вариант' })).toBeVisible();
  await expect(page.getByLabel('Email для уведомления')).toHaveCount(0);
});

test.describe('desktop product page variant selector', () => {
  test.use({
    viewport: { width: 1440, height: 960 },
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1
  });

  test('size button opens the variant list and selects a size', async ({ page }) => {
    await mockStorefrontApi(page);

    await page.goto('/product/prod-satin-sand');
    await expect(page.getByRole('heading', { name: /Сатиновый комплект Sand/i })).toBeVisible();

    const sizeButton = page.getByTestId('product-purchase-card').getByLabel('Выберите вариант');
    await expect(sizeButton).toBeVisible();
    await sizeButton.click();

    await expect(page.getByRole('listbox', { name: 'Варианты товара' })).toBeVisible();
    await page.getByRole('option', { name: /240×260/ }).click();

    await expect(sizeButton).toContainText('240×260');
    await expect(page.getByText('Нет в наличии для выбранного варианта').first()).toBeVisible();
  });
});
