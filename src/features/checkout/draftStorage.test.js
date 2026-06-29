import {
  buildCheckoutDraftKey,
  clearCheckoutDraft,
  loadCheckoutDraft,
  saveCheckoutDraft
} from './draftStorage';

describe('checkout draft storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores and restores the checkout draft in localStorage', () => {
    const draft = {
      cartId: 'cart-1',
      form: {
        activeStep: 3,
        email: 'customer@example.com'
      },
      attempt: {
        key: 'checkout-cart-1-attempt',
        signature: 'signature-1',
        orderToken: 'order-token-1'
      },
      itemSnapshot: [{ id: 'item-1', quantity: 2 }]
    };

    saveCheckoutDraft('cart-1', draft);

    expect(loadCheckoutDraft('cart-1')).toMatchObject(draft);
    expect(window.localStorage.getItem(buildCheckoutDraftKey('cart-1'))).toContain(
      '"version":3'
    );
  });

  it('expires stale drafts', () => {
    window.localStorage.setItem(
      buildCheckoutDraftKey('cart-1'),
      JSON.stringify({
        version: 3,
        savedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
        form: { email: 'old@example.com' }
      })
    );

    expect(loadCheckoutDraft('cart-1')).toBeNull();
    expect(window.localStorage.getItem(buildCheckoutDraftKey('cart-1'))).toBeNull();
  });

  it('removes the draft cleanly', () => {
    saveCheckoutDraft('cart-1', { form: { email: 'customer@example.com' } });

    clearCheckoutDraft('cart-1');

    expect(loadCheckoutDraft('cart-1')).toBeNull();
  });
});
