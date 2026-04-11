const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

async function expectMinTouchTarget(locator, { minWidth = 44, minHeight = 44 } = {}) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box.width).toBeGreaterThanOrEqual(minWidth);
  expect(box.height).toBeGreaterThanOrEqual(minHeight);
}

test('mobile primary controls keep a minimum 44x44 touch target', async ({ page }) => {
  await page.goto('/');

  await expectMinTouchTarget(page.getByRole('button', { name: 'Открыть меню' }));
  await expectMinTouchTarget(page.getByRole('link', { name: 'Открыть страницу поиска' }));
  await expectMinTouchTarget(
    page.getByRole('navigation', { name: 'Быстрая навигация' }).getByRole('link', { name: 'Корзина' })
  );

  await page.goto('/catalog');
  await expectMinTouchTarget(page.getByRole('button', { name: 'Все фильтры' }));
  await expectMinTouchTarget(page.getByRole('textbox', { name: 'Поиск по каталогу' }));

  await page.goto('/product/prod-satin-sand/satin-sand');
  await expectMinTouchTarget(page.getByRole('button', { name: 'Добавить в корзину' }));
  await expectMinTouchTarget(page.getByRole('button', { name: 'Купить сейчас' }));

  await page.getByRole('button', { name: 'Добавить в корзину' }).click();
  await page.goto('/cart');

  await expectMinTouchTarget(
    page.getByRole('button', { name: /Уменьшить количество: Сатиновый комплект Sand/i })
  );
  await expectMinTouchTarget(
    page.getByRole('button', { name: /Увеличить количество: Сатиновый комплект Sand/i })
  );
  await expectMinTouchTarget(page.getByRole('button', { name: 'Оформить заказ' }));
});
