const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('customer can add a product to cart and open checkout on mobile', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Выбор для спокойной спальни' })).toBeVisible();

  const cmsCollectionSection = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Выбор для спокойной спальни' })
  });

  const featuredProductLink = cmsCollectionSection
    .getByRole('link', { name: /Сатиновый комплект Sand/i })
    .first();
  await featuredProductLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/product\/prod-satin-sand\/satin-sand$/);
  await expect(page.getByRole('heading', { name: /Сатиновый комплект Sand/i })).toBeVisible();

  await page.getByRole('button', { name: 'Добавить в корзину' }).click();
  await expect(page.getByText('Добавлено в корзину')).toBeVisible();
  await expect(page.locator('a[aria-label="Корзина"]')).toContainText('1');

  await page.getByRole('link', { name: 'Открыть корзину' }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('heading', { name: 'Ваши товары для уюта' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Сатиновый комплект Sand' })).toBeVisible();
  await expect(page.getByText('ТестКасса (карта / СБП)')).toBeVisible();

  await page.getByRole('button', { name: 'Оформить заказ' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: /Быстрое оформление без лишних шагов/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Безопасная оплата/i })).toBeVisible();
});
