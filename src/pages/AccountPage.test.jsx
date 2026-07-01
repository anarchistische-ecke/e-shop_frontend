import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getActivePromotions,
  getCustomerOrders,
  getPublicOrder,
  payPublicOrder,
  refreshPublicOrderPayment,
  updateCustomerProfile
} from '../api';
import { useAuth } from '../contexts/AuthContext';
import AccountPage from './AccountPage';

vi.mock('../api', () => ({
  createCustomerRmaRequest: vi.fn(),
  getActivePromotions: vi.fn(),
  getCustomerOrders: vi.fn(),
  getCustomerRmaRequests: vi.fn(),
  getPublicOrder: vi.fn(),
  payPublicOrder: vi.fn(),
  refreshPublicOrderPayment: vi.fn(),
  updateCustomerProfile: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/Seo', () => ({
  default: function SeoMock() {
    return null;
  },
}));

vi.mock('./ManagerAccountPage', () => ({
  default: function ManagerAccountPageMock() {
    return <div>Manager account</div>;
  },
}));

function renderWithRouter(ui, initialPath = '/') {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <MemoryRouter
        initialEntries={[initialPath]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {ui}
      </MemoryRouter>
    );
  });

  return {
    container,
    async flush() {
      await act(async () => {
        await Promise.resolve();
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function changeInputValue(input, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(input, 'value')?.set;
  const prototype = Object.getPrototypeOf(input);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(input, value);
  } else {
    valueSetter?.call(input, value);
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('AccountPage profile', () => {
  let originalActEnvironment;

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    getActivePromotions.mockResolvedValue({ promotions: [], promoCodes: [] });
    getCustomerOrders.mockResolvedValue([]);
    getPublicOrder.mockResolvedValue(null);
    payPublicOrder.mockResolvedValue({});
    refreshPublicOrderPayment.mockResolvedValue(null);
    updateCustomerProfile.mockImplementation(async (payload) => payload);
    window.sessionStorage.clear();
    useAuth.mockReturnValue({
      isReady: true,
      isAuthenticated: true,
      tokenParsed: { email: 'buyer@example.test' },
      logout: vi.fn(),
      refreshProfile: vi.fn().mockResolvedValue({
        firstName: 'Анна',
        lastName: 'Иванова',
        phone: '+7 961 000-00-00',
        email: 'buyer@example.test',
      }),
      hasRole: (role) => role === 'customer',
      hasStrongAuth: () => false,
    });
  });

  afterEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('lets customers edit and save their phone number', async () => {
    const view = renderWithRouter(<AccountPage />, '/account#profile');

    await view.flush();

    const phoneInput = view.container.querySelector('#account-phone');
    expect(phoneInput).not.toBeNull();
    expect(phoneInput.hasAttribute('readonly')).toBe(false);

    await act(async () => {
      changeInputValue(phoneInput, '+7 999 111-22-33');
    });

    await act(async () => {
      view.container.querySelector('form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
    });

    expect(updateCustomerProfile).toHaveBeenCalledWith(expect.objectContaining({
      phone: '+7 999 111-22-33',
    }));

    view.unmount();
  });

  it('shows only the post-checkout order before email verification', async () => {
    const order = {
      id: 'order-1',
      publicToken: 'public-token',
      status: 'PENDING',
      receiptEmail: 'buyer@example.test',
      contactName: 'Анна Иванова',
      contactPhone: '+79610000000',
      homeAddress: 'Краснодар, ул. Красная, 1',
      totalAmount: { amount: 150000, currency: 'RUB' },
      items: [
        {
          id: 'item-1',
          productName: 'Комплект',
          variantName: 'Евро',
          quantity: 1,
          unitPrice: { amount: 150000, currency: 'RUB' }
        }
      ]
    };
    window.sessionStorage.setItem('cozyhome:post-checkout-account:v1', JSON.stringify({
      orderId: order.id,
      publicToken: order.publicToken,
      email: order.receiptEmail,
      accountStatus: 'MAGIC_LINK_SENT',
      redirectPath: '/account?order=order-1#orders',
      order,
      payment: {
        paymentId: 'payment-1',
        confirmationUrl: 'https://pay.example.test/checkout',
        confirmationType: 'REDIRECT'
      },
      expiresAt: Date.now() + 60000
    }));
    getPublicOrder.mockResolvedValue(order);
    useAuth.mockReturnValue({
      isReady: true,
      isAuthenticated: false,
      tokenParsed: null,
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      hasRole: () => false,
      hasStrongAuth: () => false,
    });

    const view = renderWithRouter(<AccountPage />, '/account?order=order-1#orders');
    await view.flush();

    expect(view.container.textContent).toContain('Ваш заказ');
    expect(view.container.textContent).toContain('До подтверждения здесь доступен только этот заказ');
    expect(view.container.textContent).toContain('Комплект');
    expect(view.container.textContent).not.toContain('Акции и промокоды');
    expect(getCustomerOrders).not.toHaveBeenCalled();
    expect(getPublicOrder).toHaveBeenCalledWith('public-token');

    view.unmount();
  });
});
