import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth/session.js', () => ({
  clearAllAuthStorage: vi.fn(),
  getAccessToken: vi.fn(async () => null)
}));

import { checkoutCart } from './index.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('checkoutCart', () => {
  it('sends checkout idempotency in the JSON body without a custom browser header', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    await checkoutCart({
      cartId: 'cart-1',
      receiptEmail: 'customer@example.test',
      customerName: 'Customer',
      phone: '+79990000000',
      homeAddress: 'Address',
      returnUrl: 'https://example.test/order/{token}',
      orderPageUrl: 'https://example.test/order/{token}',
      confirmationMode: 'REDIRECT',
      savePaymentMethod: false,
      idempotencyKey: 'checkout-key-1'
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers).not.toHaveProperty('Idempotency-Key');
    expect(JSON.parse(options.body)).toMatchObject({
      idempotencyKey: 'checkout-key-1'
    });
  });
});
