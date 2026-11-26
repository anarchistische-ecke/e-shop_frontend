const { test, expect } = require('@playwright/test');
const { categories } = require('./fixtures/storefront');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('mobile catalogue filters narrow results without layout regressions', async ({ page }) => {
  await page.goto('/catalog');

  await expect(page.getByTestId('catalogue-search-card')).toBeVisible();
  await expect(page.getByTestId('catalogue-header-card')).toHaveCount(0);

  await page.getByRole('button', { name: 'Все фильтры' }).click();
  await expect(page.getByRole('heading', { name: 'Уточните выбор' })).toBeVisible();

  await page.getByRole('button', { name: 'Только в наличии' }).click();
  await page.getByRole('button', { name: 'Со скидкой' }).click();
  await page.getByRole('button', { name: 'Показать товары' }).click();

  await expect(page.getByText('Песочный сатиновый комплект')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Только в наличии' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Со скидкой' })).toBeVisible();
  await expect(page.getByText('Плед Облако')).toHaveCount(0);
  await expect(page.getByText('Набор полотенец Лесной мох')).toHaveCount(0);
});

test('long category scope labels stay inside their scrollable chips on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const categoryName = 'Постельное бельё с пододеяльником';
  await page.route('**/categories', (route) => route.fulfill({
    json: categories.map((category) => category.slug === 'popular'
      ? { ...category, name: categoryName }
      : category)
  }));
  await page.goto('/catalog');

  const scope = page.getByRole('group', { name: 'Область поиска' });
  const bedding = scope.getByRole('button', { name: categoryName });
  await expect(bedding).toBeVisible();
  await expect(scope.getByRole('button', { name: 'Весь каталог' })).toHaveAttribute('aria-pressed', 'true');

  const contentFits = await scope.getByRole('button').evaluateAll((buttons) => buttons.every((button) => {
    const range = document.createRange();
    range.selectNodeContents(button);
    const text = range.getBoundingClientRect();
    const chip = button.getBoundingClientRect();
    return text.left >= chip.left && text.right <= chip.right;
  }));
  expect(contentFits).toBe(true);
  expect(await scope.evaluate((row) => row.scrollWidth)).toBeGreaterThan(await scope.evaluate((row) => row.clientWidth));

  await bedding.click();
  await expect(bedding).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/scope=popular/);
});
