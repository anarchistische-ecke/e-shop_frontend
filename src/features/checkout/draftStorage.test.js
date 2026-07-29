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
        activeStep: 1,
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
      '"version":4'
    );
  });

  it('migrates valid four-step drafts to review and invalid drafts to contact/address', () => {
    window.localStorage.setItem(
      buildCheckoutDraftKey('cart-1'),
      JSON.stringify({
        version: 3,
        savedAt: Date.now(),
        form: {
          activeStep: 3,
          email: 'buyer@example.com',
          customerName: 'Иван',
          phone: '+7 900 000-00-00',
          homeAddress: 'Краснодар, ул. Красная, 1',
          addressParts: { city: 'Краснодар', street: 'ул. Красная, 1' }
        }
      })
    );

    expect(loadCheckoutDraft('cart-1')).toMatchObject({
      version: 4,
      form: {
        activeStep: 1,
        completedSteps: { contact_address: true }
      }
    });
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
