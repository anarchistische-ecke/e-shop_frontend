const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth =
      Math.round(window.visualViewport?.width || 0) || doc?.clientWidth || window.innerWidth;

    return {
      viewportWidth,
      docScrollWidth: doc ? doc.scrollWidth : 0,
      bodyScrollWidth: body ? body.scrollWidth : 0,
      scrollX: window.scrollX,
    };
  });

  expect(Math.max(metrics.docScrollWidth, metrics.bodyScrollWidth)).toBeLessThanOrEqual(
    metrics.viewportWidth + 1
  );
  expect(Math.abs(metrics.scrollX)).toBeLessThanOrEqual(1);
}

test('mobile catalog menu takes over the viewport instead of clipping under the header', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Открыть меню' }).click();

  const mobileMenu = page.getByTestId('mobile-nav-panel');
  await expect(mobileMenu).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Меню каталога' })).toBeVisible();

  const panelBox = await mobileMenu.boundingBox();
  const viewport = page.viewportSize();

  expect(panelBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.round(panelBox.x)).toBe(0);
  expect(Math.round(panelBox.width)).toBe(Math.round(viewport.width));
});

test('core storefront routes fit the mobile viewport without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Обновите спальню/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const homeCarousel = page.locator('[data-carousel-item]').first();
  await expect(homeCarousel).toBeVisible();
  await homeCarousel.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const scroller = document.querySelector('[data-carousel-item]')?.parentElement;
    if (scroller) {
      scroller.scrollLeft = 240;
    }
  });
  await expectNoHorizontalOverflow(page);

  await page.goto('/catalog');
  await expect(page.getByRole('heading', { name: 'Подбор текстиля без лишних кликов' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/category/popular');
  await expect(page.getByRole('heading', { name: 'Популярное' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/product/prod-satin-sand/satin-sand');
  await expect(page.getByRole('heading', { name: /Сатиновый комплект Sand/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Добавить в корзину' }).click();
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Ваши товары для уюта' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Оформить заказ' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: /Быстрое оформление без лишних шагов/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/info/delivery');
  await expect(
    page.getByRole('heading', { name: /Бесплатная доставка при оформлении заказа/i })
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
