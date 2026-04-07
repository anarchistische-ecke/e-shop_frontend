import {
  ACCOUNT_DEFAULT_SECTION,
  ACCOUNT_ORDERS_SECTION,
  CART_SESSION_STRATEGY,
  buildAccountOrderPath,
  buildAccountSectionPath,
  buildLoginRedirectPath,
  findAccountOrderById,
  resolveAccountLocationState,
  resolveCartSessionAfterAuthChange
} from './account';

describe('account helpers', () => {
  it('keeps the current device cart across auth changes', () => {
    expect(CART_SESSION_STRATEGY.code).toBe('PRESERVE_DEVICE_CART');
    expect(
      resolveCartSessionAfterAuthChange({
        currentCartId: 'cart-active',
        storedCartId: 'cart-stored'
      })
    ).toEqual({
      strategy: 'PRESERVE_DEVICE_CART',
      cartId: 'cart-active',
      preserveExistingCart: true
    });
    expect(
      resolveCartSessionAfterAuthChange({
        currentCartId: '',
        storedCartId: 'cart-stored'
      }).cartId
    ).toBe('cart-stored');
  });

  it('builds safe login redirects and account order links', () => {
    expect(
      buildLoginRedirectPath({
        pathname: '/checkout',
        search: '?step=delivery',
        hash: '#review'
      })
    ).toBe('/checkout?step=delivery#review');
    expect(
      buildLoginRedirectPath({
        pathname: '//malicious.example.com',
        search: '',
        hash: ''
      })
    ).toBe('/account');
    expect(
      buildLoginRedirectPath({
        pathname: '/login',
        search: '',
        hash: ''
      })
    ).toBe('/account');

    expect(
      buildAccountOrderPath({ id: '123', publicToken: 'public-token' })
    ).toBe('/order/public-token');
    expect(buildAccountOrderPath({ id: '123' })).toBe('/account?order=123#orders');
    expect(buildAccountSectionPath('profile')).toBe('/account#profile');
  });

  it('resolves account section state and selected orders from the url', () => {
    expect(
      resolveAccountLocationState({
        hash: '',
        search: '?order=abc'
      })
    ).toEqual({
      section: ACCOUNT_ORDERS_SECTION,
      orderId: 'abc'
    });

    expect(
      resolveAccountLocationState({
        hash: '#bonuses',
        search: '?order=abc'
      })
    ).toEqual({
      section: 'bonuses',
      orderId: ''
    });

    expect(
      resolveAccountLocationState({
        hash: '',
        search: ''
      })
    ).toEqual({
      section: ACCOUNT_DEFAULT_SECTION,
      orderId: ''
    });

    expect(
      findAccountOrderById(
        [{ id: '1' }, { id: '2', publicToken: 'public-2' }],
        '2'
      )
    ).toEqual({ id: '2', publicToken: 'public-2' });
  });
});
