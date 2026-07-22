import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('../components/Header', () => ({
  default: function HeaderMock() {
    return <header>Header</header>;
  },
}));

vi.mock('../components/Footer', () => ({
  default: function FooterMock() {
    return <footer>Footer</footer>;
  },
}));

vi.mock('../components/ScrollToTop', () => ({
  default: function ScrollToTopMock() {
    return null;
  },
}));

vi.mock('../components/chat/CustomerChatWidget', () => ({
  default: function CustomerChatWidgetMock() {
    return <div data-testid="customer-chat-widget">Chat widget</div>;
  },
}));

vi.mock('../utils/metrika', () => ({
  trackPageView: vi.fn(),
}));

function renderApp(initialPath) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const routes = [
    {
      id: 'home',
      path: '/',
      renderMode: 'ssr',
      renderElement: () => <div>Home page</div>,
    },
    {
      id: 'manager-login',
      path: '/manager/login',
      renderMode: 'csr',
      renderElement: () => <div>Manager login</div>,
    },
  ];

  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App routes={routes} />
      </MemoryRouter>
    );
  });

  return {
    container,
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('App chat widget mounting', () => {
  let originalActEnvironment;

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    vi.clearAllMocks();
  });

  it('renders customer chat widget on public storefront routes', () => {
    const view = renderApp('/');

    expect(view.container.querySelector('[data-testid="customer-chat-widget"]')).not.toBeNull();
    expect(view.container.textContent).toContain('Header');
    expect(view.container.textContent).toContain('Footer');
    view.unmount();
  });

  it('hides customer chat widget on manager login route', () => {
    const view = renderApp('/manager/login');

    expect(view.container.querySelector('[data-testid="customer-chat-widget"]')).toBeNull();
    expect(view.container.textContent).not.toContain('Header');
    expect(view.container.textContent).not.toContain('Footer');
    view.unmount();
  });
});
