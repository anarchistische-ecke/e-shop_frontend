import {
  buildCheckoutAttemptSignature,
  resolveCheckoutAttempt
} from './utils';

describe('checkout attempt helpers', () => {
  it('reuses the same idempotency key for the same payload signature', () => {
    const signature = buildCheckoutAttemptSignature({
      cartId: 'cart-1',
      receiptEmail: 'test@example.com',
      returnUrl: 'https://example.com/order/{token}',
      orderPageUrl: 'https://example.com/order/{token}',
      savePaymentMethod: false,
      delivery: {
        deliveryType: 'COURIER',
        offerId: 'offer-1',
        address: 'ул. Пушкина, дом Колотушкина',
        firstName: 'Иван',
        phone: '+79990000000',
        email: 'test@example.com'
      }
    });

    const firstAttempt = resolveCheckoutAttempt({
      cartId: 'cart-1',
      signature,
      existingAttempt: null
    });
    const secondAttempt = resolveCheckoutAttempt({
      cartId: 'cart-1',
      signature,
      existingAttempt: firstAttempt
    });

    expect(secondAttempt).toEqual(firstAttempt);
  });

  it('creates a new idempotency key when the payload signature changes', () => {
    const firstAttempt = resolveCheckoutAttempt({
      cartId: 'cart-1',
      signature: 'one',
      existingAttempt: null
    });
    const secondAttempt = resolveCheckoutAttempt({
      cartId: 'cart-1',
      signature: 'two',
      existingAttempt: firstAttempt
    });

    expect(secondAttempt.key).not.toBe(firstAttempt.key);
    expect(secondAttempt.signature).toBe('two');
  });

  it('creates a new idempotency key when the cart changes', () => {
    const firstAttempt = resolveCheckoutAttempt({
      cartId: 'cart-1',
      signature: 'same-signature',
      existingAttempt: null
    });
    const secondAttempt = resolveCheckoutAttempt({
      cartId: 'cart-2',
      signature: 'same-signature',
      existingAttempt: firstAttempt
    });

    expect(secondAttempt.key).not.toBe(firstAttempt.key);
    expect(secondAttempt.signature).toBe('same-signature');
  });
});
