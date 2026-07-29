import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmMarketingSubscription } from '../api';
import { trackGoal } from '../utils/metrika';
import SubscriptionActionPage from './SubscriptionActionPage';

vi.mock('../api', () => ({
  confirmMarketingSubscription: vi.fn(),
  unsubscribeMarketingSubscription: vi.fn(),
}));

vi.mock('../utils/metrika', () => ({
  METRIKA_GOALS: {
    NEWSLETTER_CONFIRMED: 'newsletter_confirmed',
  },
  trackGoal: vi.fn(),
}));

vi.mock('../components/Seo', () => ({
  default: function SeoMock() {
    return null;
  },
}));

function renderPage() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SubscriptionActionPage mode="confirm" />
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

describe('SubscriptionActionPage', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.history.replaceState({}, '', '/subscribe/confirm?token=opaque-secret');
    confirmMarketingSubscription.mockResolvedValue({ status: 'CONFIRMED' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('removes the token from browser history before confirming and tracks success', async () => {
    let view;
    await act(async () => {
      view = renderPage();
    });

    expect(window.location.pathname).toBe('/subscribe/confirm');
    expect(window.location.search).toBe('');
    expect(confirmMarketingSubscription).toHaveBeenCalledWith('opaque-secret');
    expect(trackGoal).toHaveBeenCalledWith('newsletter_confirmed', {
      source: 'email_link',
    });
    expect(view.container.textContent).toContain('Подписка подтверждена');
    view.unmount();
  });
});
