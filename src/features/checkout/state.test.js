import {
  createInitialAttempt,
  createInitialSafeRetryState,
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

});
