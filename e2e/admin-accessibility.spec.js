const { test, expect } = require('@playwright/test');
const { mockAdminApi, seedAdminSession } = require('./support/adminSession');

test('admin login exposes a real page heading and skip link', async ({ page }) => {
  await page.goto('/admin/login');

  await expect(page.getByRole('heading', { level: 1, name: 'Войти в админ-панель' })).toBeVisible();

  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: 'Перейти к форме входа' });
  await expect(skipLink).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.locator('#admin-login-title')).toBeFocused();
});

test.describe('authenticated admin shell', () => {
  test.beforeEach(async ({ page }) => {
    await seedAdminSession(page);
    await mockAdminApi(page);
  });

  test('admin skip link moves focus to the main content region', async ({ page }) => {
    await page.goto('/admin/content');

    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: 'Перейти к содержимому админки' });
    await expect(skipLink).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.locator('#admin-main')).toBeFocused();
  });

  test('mobile admin navigation closes on escape and restores focus to the trigger', async ({ page }) => {
    await page.goto('/admin/content');

    const menuTrigger = page.getByRole('button', { name: 'Открыть меню навигации' });
    await menuTrigger.click();

    const mobileMenu = page.getByRole('dialog', { name: 'Admin Console' });
    const closeButton = mobileMenu.getByRole('button', { name: 'Закрыть меню' });

    await expect(mobileMenu).toBeVisible();
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Admin Console' })).toHaveCount(0);
    await expect(menuTrigger).toBeFocused();
  });

  test('mobile admin navigation traps focus inside the dialog', async ({ page }) => {
    await page.goto('/admin/content');

    await page.getByRole('button', { name: 'Открыть меню навигации' }).click();

    const mobileMenu = page.getByRole('dialog', { name: 'Admin Console' });
    const closeButton = mobileMenu.getByRole('button', { name: 'Закрыть меню' });
    const dashboardLink = mobileMenu.getByRole('link', { name: 'Дашборд' });
    const logoutButton = mobileMenu.getByRole('button', { name: 'Выйти' }).first();

    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(logoutButton).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(dashboardLink).toBeFocused();
  });

  test('admin brands search is labelled and delete uses a real confirm dialog', async ({ page }) => {
    await page.goto('/admin/brands');

    await expect(page.getByLabel('Поиск брендов')).toBeVisible();

    const deleteButton = page.getByRole('button', { name: 'Удалить' }).first();
    await deleteButton.click();

    const dialog = page.getByRole('dialog', { name: 'Удалить бренд?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Удалить бренд' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Удалить бренд?' })).toHaveCount(0);
    await expect(deleteButton).toBeFocused();
  });
});
