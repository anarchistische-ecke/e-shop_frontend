import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getActivePromotions,
  getCustomerOrders,
  updateCustomerProfile
} from '../api';
import { useAuth } from '../contexts/AuthContext';
import AccountPage from './AccountPage';

vi.mock('../api', () => ({
  createCustomerRmaRequest: vi.fn(),
  getActivePromotions: vi.fn(),
  getCustomerOrders: vi.fn(),
  getCustomerRmaRequests: vi.fn(),
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
    updateCustomerProfile.mockImplementation(async (payload) => payload);
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
});
