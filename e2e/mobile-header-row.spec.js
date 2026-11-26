const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('mobile sticky menu stays anchored to the bottom and opens the full catalog menu', async ({ page }) => {
  await page.goto('/');

  const stickyMenu = page.getByTestId('mobile-sticky-menu');
  await expect(stickyMenu).toBeVisible();

  const menuBox = await stickyMenu.boundingBox();
  const viewport = page.viewportSize();
  expect(menuBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(menuBox.y).toBeGreaterThan(viewport.height / 2);
  expect(Math.round(menuBox.y + menuBox.height)).toBeLessThanOrEqual(viewport.height);

  await page.getByRole('button', { name: 'Меню' }).click();

  const mobileMenu = page.getByTestId('mobile-nav-panel');
  await expect(mobileMenu).toBeVisible();
  await expect(mobileMenu.getByRole('link', { name: 'Весь каталог' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Перейти к поиску товаров и категорий' })).toBeVisible();
});

test('customer chat clears the mobile navigation and fits in a short viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 568 });
  await page.goto('/catalog');

  const stickyMenu = page.getByTestId('mobile-sticky-menu');
  const launcher = page.getByTestId('customer-chat-launcher');
  await expect(stickyMenu).toBeVisible();
  await expect(launcher).toBeVisible();

  const navigation = await stickyMenu.boundingBox();
  const chat = await launcher.boundingBox();
  expect(chat.y + chat.height).toBeLessThan(navigation.y);

  await launcher.click();
  const panel = page.getByRole('region', { name: 'Чат с менеджером' });
  await expect(panel).toBeVisible();
  expect((await panel.boundingBox()).y).toBeGreaterThanOrEqual(0);

  await stickyMenu.getByRole('button', { name: 'Корзина' }).click();
  await expect(page.getByRole('dialog', { name: 'Корзина' })).toBeVisible();
});

test('guests can scroll to the chat composer on a phone in landscape', async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 390 });
  await page.goto('/catalog');
  await page.getByTestId('customer-chat-launcher').click();

  const panel = page.getByRole('region', { name: 'Чат с менеджером' });
  const message = panel.getByRole('textbox', { name: 'Сообщение' });
  const send = panel.getByRole('button', { name: 'Отправить' });
  const { height } = await panel.boundingBox();

  await panel.hover({ position: { x: 24, y: height - 12 } });
  await page.mouse.wheel(0, 300);

  await expect(send).toBeInViewport({ ratio: 1 });
  await message.fill('Подскажите, как выбрать размер?');
  await send.click({ trial: true });
});

test('guests can close chat on a short desktop window', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 450 });
  await page.goto('/catalog');
  await page.getByTestId('customer-chat-launcher').click();

  const panel = page.getByRole('region', { name: 'Чат с менеджером' });
  await panel.getByRole('button', { name: 'Закрыть чат' }).click();
  await expect(panel).toBeHidden();
});

test('mobile header search opens inline suggestions and submits to search results', async ({ page }) => {
  await page.goto('/category/throws');

  await page.getByRole('button', { name: 'Поиск' }).click();
  const searchInput = page.getByRole('searchbox', { name: 'Поиск товаров' });
  await expect(searchInput).toBeFocused();
  await searchInput.fill('Плед');
  await expect(page.getByTestId('header-search-suggestions-mobile')).toBeVisible();
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/\/search\?query=/);
  await expect(page.getByRole('heading', { name: /Найдено/i })).toBeVisible();
});

test('mobile header row remains available on the magic-link login flow', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('navigation', { name: 'Быстрая навигация' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Меню' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Поиск' })).toBeVisible();
});

test('sticky menu stays clear of product, cart, and checkout action bars', async ({ page }) => {
  await page.goto('/product/prod-satin-sand/satin-sand');
  await expect(page.getByTestId('mobile-sticky-menu')).toBeHidden();

  await page.goto('/cart');
  await expect(page.getByTestId('mobile-sticky-menu')).toBeHidden();

  await page.goto('/checkout');
  await expect(page.getByTestId('mobile-sticky-menu')).toBeHidden();
});
