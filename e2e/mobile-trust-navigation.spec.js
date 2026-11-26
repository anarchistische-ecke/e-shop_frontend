const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

test('mobile menu exposes trust content within one tap', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Меню' }).click();

  const mobileMenu = page.getByRole('dialog', { name: 'Меню каталога' });

  await expect(mobileMenu.getByText('Почему нам доверяют')).toBeVisible();

  const legalLink = mobileMenu.getByRole('link', {
    name: /Реквизиты и документы/i
  });
  await expect(legalLink).toBeVisible();

  await legalLink.click();

  await expect(page).toHaveURL(/\/info\/legal$/);
  await expect(page.getByRole('heading', { name: /Документы и регламенты/i })).toBeVisible();
});

test('product pages link to delivery help before payment', async ({ page }) => {
  await page.goto('/product/prod-satin-sand/satin-sand');
  await page.getByRole('link', { name: /Уточнить доставку/ }).click();

  await expect(page).toHaveURL(/\/info\/delivery#delivery-contact$/);
  const contacts = page.getByRole('region', { name: 'Уточнить доставку до оплаты' });
  await expect(contacts.getByRole('heading')).toBeInViewport();
  await expect(contacts.getByRole('link', { name: 'Позвонить' })).toHaveAttribute('href', /^tel:/);
  await expect(contacts.getByRole('link', { name: 'Написать на почту' })).toHaveAttribute('href', /^mailto:/);
});

test('mobile mini-cart opens as a padded bottom sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalog');
  await page.locator('main').getByRole('button', { name: 'В корзину' }).first().click();
  await page.getByRole('button', { name: 'Корзина' }).click();

  const sheet = page.getByRole('dialog', { name: 'Корзина' });
  await expect(sheet.getByText('1 товар', { exact: true })).toBeVisible();
  await expect(sheet).toHaveCSS('padding-left', '16px');
  await expect.poll(() => sheet.evaluate((element) => Math.round(element.getBoundingClientRect().bottom))).toBe(844);
  const box = await sheet.boundingBox();
  expect(box.y).toBeGreaterThan(0);
});
