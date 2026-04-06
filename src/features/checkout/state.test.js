import {
  createInitialAttempt,
  createInitialSafeRetryState,
  createPickupLocationSuggestion,
  createSafeRetryState
} from './state';

describe('checkout state helpers', () => {
  it('normalizes stored attempts', () => {
    expect(createInitialAttempt()).toEqual({
      cartId: '',
      key: '',
      signature: '',
      orderToken: ''
    });

    expect(
      createInitialAttempt({
        attempt: {
          cartId: 'cart-1',
          key: 'key-1',
          signature: 'sig-1',
          orderToken: 'order-1'
        }
      })
    ).toEqual({
      cartId: 'cart-1',
      key: 'key-1',
      signature: 'sig-1',
      orderToken: 'order-1'
    });
  });

  it('creates safe retry states from attempt drafts', () => {
    expect(
      createInitialSafeRetryState({}, {
        cartId: 'cart-1',
        key: 'retry-key',
        signature: 'sig-1',
        orderToken: 'order-1'
      })
    ).toEqual(
      expect.objectContaining({
        kind: 'timeout',
        orderToken: 'order-1',
        retryLabel: 'Повторить безопасно'
      })
    );

    expect(
      createSafeRetryState('missing_confirmation', { orderToken: 'order-2' })
    ).toEqual(
      expect.objectContaining({
        kind: 'missing_confirmation',
        orderToken: 'order-2',
        retryLabel: 'Получить ссылку оплаты'
      })
    );
  });

  it('creates pickup suggestions only for non-empty cities', () => {
    expect(createPickupLocationSuggestion('')).toBeNull();
    expect(createPickupLocationSuggestion('Москва', 'timezone')).toEqual(
      expect.objectContaining({
        city: 'Москва',
        source: 'timezone'
      })
    );
    expect(createPickupLocationSuggestion('Сочи', 'geocoder')).toEqual(
      expect.objectContaining({
        city: 'Сочи',
        source: 'geocoder'
      })
    );
  });
});
