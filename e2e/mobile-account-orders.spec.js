const { test, expect } = require('@playwright/test');
const {
  createCustomerOrder,
  mockStorefrontApi,
} = require('./support/mockStorefrontApi');
const { seedCustomerSession } = require('./support/customerAuth');

test('mobile account orders show status timeline tracking and RMA sheet', async ({ page }) => {
  await mockStorefrontApi(page, {
    customerOrders: [
      createCustomerOrder({
        id: 'order-mobile-tracked-1',
        status: 'PAID',
        updatedAt: '2026-06-20T12:00:00.000Z',
        statusUpdatedAt: '2026-06-20T12:00:00.000Z',
        trackingNumber: 'TRACK-123',
        trackingUrl: 'https://track.example.test/TRACK-123',
        carrierName: 'СДЭК',
      }),
    ],
  });
  await seedCustomerSession(page);

  await page.goto('/account#orders');

  await expect(page.getByRole('heading', { name: 'Мои заказы' })).toBeVisible();
  await expect(page.getByText('Передан менеджеру').first()).toBeVisible();
  await expect(page.getByText(/Обновлено:/).first()).toBeVisible();
  await expect(page.getByText('Менеджер').first()).toBeVisible();

  const trackingLink = page.getByRole('link', { name: /Трек TRACK-123/i }).first();
  await expect(trackingLink).toBeVisible();
  await expect(trackingLink).toHaveAttribute('href', 'https://track.example.test/TRACK-123');

  await page.getByRole('button', { name: 'Возврат' }).first().click();
  const rmaSheet = page.getByRole('dialog', { name: 'Заявка на возврат' });
  await expect(rmaSheet).toBeVisible();
  await expect(rmaSheet.getByRole('button', { name: 'Отправить заявку' })).toBeVisible();
});
