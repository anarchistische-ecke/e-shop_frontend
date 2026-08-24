const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

async function getGridColumnCount(locator) {
  return locator.evaluate((node) => {
    const columns = window.getComputedStyle(node).gridTemplateColumns;
    return columns.split(' ').filter(Boolean).length;
  });
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => {
    const viewportWidth = Math.round(window.visualViewport?.width || window.innerWidth);
    return {
      viewportWidth,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      scrollX: window.scrollX,
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(Math.abs(metrics.scrollX)).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('catalog listing follows the 390, 768, and 1024 breakpoint grid', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalog');
  await expect(page.getByTestId('catalogue-search-card')).toBeVisible();
  await expect(page.getByTestId('catalogue-breadcrumbs')).toBeHidden();
  expect(await getGridColumnCount(page.getByTestId('catalogue-results').locator('.page-grid--catalog').first())).toBe(2);
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.getByTestId('catalogue-breadcrumbs')).toBeVisible();
  expect(await getGridColumnCount(page.getByTestId('catalogue-results').locator('.page-grid--catalog').first())).toBe(3);
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 1024, height: 900 });
  expect(await getGridColumnCount(page.getByTestId('catalogue-results').locator('.page-grid--catalog').first())).toBe(4);
  await expectNoHorizontalOverflow(page);
});

test('mobile filter sheet uses a 75dvh bottom sheet with sticky apply controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalog');

  await page.getByRole('button', { name: 'Все фильтры' }).click();
  const dialog = page.getByRole('dialog', { name: 'Уточните выбор' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Показать товары' })).toBeVisible();

  const [dialogBox, viewport] = await Promise.all([
    dialog.boundingBox(),
    page.viewportSize(),
  ]);
  expect(dialogBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(dialogBox.height).toBeLessThanOrEqual(viewport.height * 0.78);
  expect(dialogBox.height).toBeGreaterThanOrEqual(viewport.height * 0.55);

  await dialog.getByRole('spinbutton').first().focus();
  await expect(dialog.getByTestId('product-filters-sheet-actions')).toHaveCSS('opacity', '0');
});

test('mobile category uses one coherent card and filter system', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/category/popular');

  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /фильтр/i })).toHaveCount(1);

  const firstCard = page.locator('.product-card').first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard.getByRole('button', { name: 'Добавить в избранное' })).toBeVisible();

  const availabilityCount = await firstCard.locator('p, span').evaluateAll((elements) =>
    elements.filter((element) => element.textContent.trim() === 'В наличии').length
  );
  expect(availabilityCount).toBe(1);

  const headerOverflow = await page.locator('header').evaluate((header) =>
    [...header.querySelectorAll('button, a')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .slice(0, 5)
      .some((element) => element.scrollWidth > element.clientWidth)
  );
  expect(headerOverflow).toBe(false);
  await expectNoHorizontalOverflow(page);
});

test('product page hides mobile breadcrumbs and keeps PDP sticky CTA safe-area aware', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/product/prod-satin-sand/satin-sand');

  await expect(page.getByRole('heading', { name: /Песочный сатиновый комплект/i })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Хлебные крошки' })).toBeHidden();

  const stickyBar = page.getByTestId('product-mobile-cart-bar');
  await expect(stickyBar).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Товары коллекции' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'С этим товаром покупают' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Что входит в комплект/ })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: /Описание/ })).toHaveAttribute('aria-expanded', 'false');
  const box = await stickyBar.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.round(box.y + box.height)).toBeLessThanOrEqual(viewport.height + 1);
  await expectNoHorizontalOverflow(page);
});
