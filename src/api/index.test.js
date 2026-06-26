import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth/session.js', () => ({
  clearAllAuthStorage: vi.fn(),
  getAccessToken: vi.fn(async () => null)
}));

import { checkoutCart, createManagerOrderLink, getProducts } from './index.js';

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

describe('createManagerOrderLink', () => {
  it('sends manager link idempotency in the JSON body', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({
      orderId: 'order-1',
      publicToken: 'public-token',
      orderUrl: 'https://example.test/order/public-token',
      emailSent: false
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    }));

    await createManagerOrderLink({
      cartId: 'cart-1',
      receiptEmail: 'customer@example.test',
      customerName: 'Customer',
      phone: '+79990000000',
      homeAddress: 'Address',
      orderPageUrl: 'https://example.test/order/{token}',
      sendEmail: false,
      idempotencyKey: 'manager-link-key-1'
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(JSON.parse(options.body)).toMatchObject({
      cartId: 'cart-1',
      sendEmail: false,
      idempotencyKey: 'manager-link-key-1'
    });
  });
});

describe('getProducts', () => {
  it.each([49, 97, 193])('loads all %s products across backend pages', async (productCount) => {
    const products = Array.from({ length: productCount }, (_, index) => ({
      id: `product-${index + 1}`,
      name: `Product ${index + 1}`,
      isActive: true
    }));

    globalThis.fetch = vi.fn(async (input) => {
      const url = new URL(String(input));
      const page = Number(url.searchParams.get('page') || 0);
      const size = Number(url.searchParams.get('size') || 96);
      const data = products.slice(page * size, (page + 1) * size);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Page': String(page),
          'X-Total-Pages': String(Math.ceil(products.length / size))
        }
      });
    });

    await expect(getProducts()).resolves.toEqual(products);
    expect(globalThis.fetch).toHaveBeenCalledTimes(Math.ceil(productCount / 96));
  });

  it('falls back to a short final page when pagination headers are unavailable', async () => {
    const products = Array.from({ length: 97 }, (_, index) => ({ id: `product-${index + 1}` }));
    globalThis.fetch = vi.fn(async (input) => {
      const url = new URL(String(input));
      const page = Number(url.searchParams.get('page') || 0);
      const data = products.slice(page * 96, (page + 1) * 96);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    await expect(getProducts()).resolves.toEqual(products);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('rejects repeated full pages instead of looping forever', async () => {
    const page = Array.from({ length: 96 }, (_, index) => ({ id: `product-${index + 1}` }));
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(page), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    await expect(getProducts()).rejects.toThrow('did not advance');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
