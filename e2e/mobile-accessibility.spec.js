const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('mobile skip link moves focus past the fixed header', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: 'Перейти к содержимому' });
  await expect(skipLink).toBeVisible();

  await page.keyboard.press('Enter');

  await expect(page.locator('#main-content')).toBeFocused();
});

test('mobile catalog menu closes on escape and returns focus to the trigger', async ({ page }) => {
  await page.goto('/');

  const menuTrigger = page.getByRole('button', { name: 'Открыть меню' });
  await menuTrigger.click();

  const mobileMenu = page.getByRole('dialog', { name: 'Меню каталога' });
  await expect(mobileMenu).toBeVisible();
  await expect(mobileMenu.getByRole('button', { name: 'Закрыть меню' })).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(mobileMenu).toHaveCount(0);
  await expect(menuTrigger).toBeFocused();
});

test('mobile catalog menu traps keyboard focus inside the dialog', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Открыть меню' }).click();

  const mobileMenu = page.getByRole('dialog', { name: 'Меню каталога' });
  const closeButton = mobileMenu.getByRole('button', { name: 'Закрыть меню' });
  const searchLink = mobileMenu.getByRole('link', { name: 'Перейти к поиску товаров и категорий' });

  await expect(closeButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(searchLink).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(closeButton).toBeFocused();
});

test('mobile filter sheet restores focus to its trigger when dismissed', async ({ page }) => {
  await page.goto('/catalog');

  const filterTrigger = page.getByRole('button', { name: 'Все фильтры' });
  await filterTrigger.click();

  const filterDialog = page.getByRole('dialog', { name: 'Уточните выбор' });
  await expect(filterDialog).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(filterDialog).toHaveCount(0);
  await expect(filterTrigger).toBeFocused();
});

test('mobile product tabs support arrow-key navigation', async ({ page }) => {
  await page.goto('/product/prod-satin-sand/satin-sand');

  const aboutTab = page.getByRole('tab', { name: 'О товаре' });
  const detailsTab = page.getByRole('tab', { name: 'Характеристики' });

  await aboutTab.focus();
  await expect(aboutTab).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowRight');

  await expect(detailsTab).toBeFocused();
  await expect(detailsTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#product-tabs-panel-details')).toBeVisible();
});
