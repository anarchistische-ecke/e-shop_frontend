import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMarketingSubscription } from '../../api';
import { trackGoal } from '../../utils/metrika';
import NewsletterForm from './NewsletterForm';

vi.mock('../../api', () => ({
  createMarketingSubscription: vi.fn(),
}));

vi.mock('../../utils/metrika', () => ({
  METRIKA_GOALS: {
    NEWSLETTER_SUBMIT: 'newsletter_submit',
  },
  trackGoal: vi.fn(),
}));

function renderForm() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NewsletterForm />
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

function changeInput(input, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;
  valueSetter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('NewsletterForm', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    createMarketingSubscription.mockResolvedValue({ status: 'PENDING' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('requires explicit consent before sending the address', async () => {
    const view = renderForm();
    const input = view.container.querySelector('input[type="email"]');
    const form = view.container.querySelector('form');

    act(() => {
      changeInput(input, 'buyer@example.ru');
    });
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(createMarketingSubscription).not.toHaveBeenCalled();
    expect(view.container.textContent).toContain('Подтвердите согласие');
    view.unmount();
  });

  it('submits a privacy-safe double-opt-in request and tracks it once', async () => {
    const view = renderForm();
    const input = view.container.querySelector('input[type="email"]');
    const consent = view.container.querySelector('input[type="checkbox"]');
    const form = view.container.querySelector('form');

    act(() => {
      changeInput(input, ' Buyer@Example.RU ');
      consent.click();
    });
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(createMarketingSubscription).toHaveBeenCalledWith({
      email: 'Buyer@Example.RU',
      consent: true,
      source: 'home_newsletter',
    });
    expect(trackGoal).toHaveBeenCalledWith('newsletter_submit', {
      source: 'home_newsletter',
    });
    expect(view.container.textContent).toContain('Проверьте почту');
    view.unmount();
  });
});
