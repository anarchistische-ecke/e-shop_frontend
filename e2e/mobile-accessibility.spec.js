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

  const menuTrigger = page.getByRole('button', { name: 'Меню' });
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

  await page.getByRole('button', { name: 'Меню' }).click();

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

test('mobile product information accordion is keyboard operable', async ({ page }) => {
  await page.goto('/product/prod-satin-sand/satin-sand');

  const descriptionButton = page.getByRole('button', { name: /Описание/ });
  const detailsButton = page.getByRole('button', { name: /Характеристики/ });

  await descriptionButton.focus();
  await expect(descriptionButton).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Tab');
  await expect(detailsButton).toBeFocused();

  await page.keyboard.press('Enter');

  await expect(detailsButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#pdp-details-panel')).toBeVisible();
});
