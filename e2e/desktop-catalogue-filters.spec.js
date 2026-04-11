const { test, expect, devices } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.use({
  ...devices['Desktop Chrome'],
  viewport: { width: 1440, height: 960 },
  isMobile: false,
  hasTouch: false
});

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('desktop catalog scope chips filter results and can be cleared', async ({ page }) => {
  await page.goto('/catalog');

  const scopeChip = page.getByRole('button', { name: 'Пледы' }).first();
  await expect(scopeChip).toBeVisible();

  await scopeChip.click();

  await expect(page).toHaveURL(/\/catalog\?scope=throws/);
  await expect(page.getByText(/3\s+товар/)).toHaveCount(0);
  await expect(page.getByText(/1\s+товар/)).toBeVisible();
  await expect(page.getByText('Плед Cloud')).toBeVisible();
  await expect(page.getByText('Сатиновый комплект Sand')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Категория: Пледы/i })).toBeVisible();

  await page.getByRole('button', { name: /Категория: Пледы/i }).click();

  await expect(page).toHaveURL(/\/catalog$/);
  await expect(page.getByText('Плед Cloud')).toBeVisible();
  await expect(page.getByText('Сатиновый комплект Sand')).toBeVisible();
  await expect(page.getByText('Набор полотенец Moss')).toBeVisible();
});

test('desktop footer stays centered and compact on wide screens', async ({ page }) => {
  await page.goto('/');

  const footerContent = page.getByTestId('site-footer-content');
  await footerContent.scrollIntoViewIfNeeded();
  await expect(footerContent).toBeVisible();

  const metrics = await footerContent.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return {
      width: rect.width,
      viewportWidth: window.innerWidth
    };
  });

  expect(metrics.width).toBeLessThanOrEqual(1160);
  expect(metrics.width / metrics.viewportWidth).toBeLessThan(0.82);
});
