import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCheckoutState } from '../features/checkout/useCheckoutState';
import CheckoutPage from './CheckoutPage';

vi.mock('../features/checkout/useCheckoutState', () => ({
  useCheckoutState: vi.fn(),
}));

vi.mock('../components/Seo', () => ({
  default: function SeoMock() {
    return null;
  },
}));

vi.mock('../features/checkout/CheckoutFlow', () => ({
  default: function CheckoutFlowMock() {
    return <div>Checkout flow</div>;
  },
}));

vi.mock('../features/checkout/CheckoutPageHeader', () => ({
  default: function CheckoutPageHeaderMock() {
    return <div>Checkout header</div>;
  },
}));

vi.mock('../features/checkout/CheckoutEmptyState', () => ({
  default: function CheckoutEmptyStateMock() {
    return <div>Empty checkout</div>;
  },
}));

function renderWithRouter(ui) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </MemoryRouter>
    );
  });

  return {
    container,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('CheckoutPage', () => {
  let originalActEnvironment;

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    useCheckoutState.mockReturnValue({
      isManager: false,
      items: [{ id: 'item-1', quantity: 1 }],
      isSubmitting: false,
      topNotification: null,
      clearStatus: vi.fn()
    });
  });

  afterEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    vi.clearAllMocks();
  });

  it('renders checkout without guest or login choice panel', () => {
    const view = renderWithRouter(<CheckoutPage />);

    expect(view.container.textContent).toContain('Checkout flow');
    expect(view.container.textContent).not.toContain('Оформление как гость');
    expect(view.container.textContent).not.toContain('Войти и сохранить данные');

    view.unmount();
  });
});
