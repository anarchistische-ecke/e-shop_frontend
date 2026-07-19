import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChatConversation, getChatMessages, sendChatMessage } from '../../api';
import CustomerChatWidget from './CustomerChatWidget';

vi.mock('../../api', () => ({
  createChatConversation: vi.fn(),
  getChatMessages: vi.fn(),
  sendChatMessage: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { firstName: 'Анна', lastName: 'Иванова', phone: '+7 900' },
    tokenParsed: { email: 'anna@example.test' },
  }),
}));

function renderWidget() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<CustomerChatWidget />);
  });
  return {
    container,
    async flush() {
      await act(async () => {
        await Promise.resolve();
      });
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function changeValue(input, value) {
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

describe('CustomerChatWidget', () => {
  let originalActEnvironment;

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    createChatConversation.mockResolvedValue({
      conversationId: 'chat-1',
      conversationToken: 'token-1',
      status: 'OPEN',
      messages: [
        {
          id: 'message-1',
          sender: 'CUSTOMER',
          senderLabel: 'Анна',
          body: 'Здравствуйте',
          createdAt: '2026-07-17T10:00:00Z',
        },
      ],
    });
    getChatMessages.mockResolvedValue({ conversationId: 'chat-1', status: 'OPEN', messages: [] });
    sendChatMessage.mockResolvedValue({
      conversationId: 'chat-1',
      status: 'OPEN',
      messages: [
        {
          id: 'message-2',
          sender: 'CUSTOMER',
          senderLabel: 'Анна',
          body: 'Еще вопрос',
          createdAt: '2026-07-17T10:01:00Z',
        },
      ],
    });
  });

  afterEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('opens and closes from the floating chat button', async () => {
    const view = renderWidget();

    expect(view.container.textContent).not.toContain('Чат с менеджером');
    await act(async () => {
      view.container.querySelector('button[aria-label="Открыть чат"]').click();
    });
    expect(view.container.textContent).toContain('Чат с менеджером');

    await act(async () => {
      view.container.querySelector('button[aria-label="Закрыть чат"]').click();
    });
    expect(view.container.textContent).not.toContain('Чат с менеджером');
    view.unmount();
  });

  it('creates a conversation on first message and persists the token', async () => {
    const view = renderWidget();
    await act(async () => {
      view.container.querySelector('button[aria-label="Открыть чат"]').click();
    });
    const textarea = view.container.querySelector('#customer-chat-message');
    await act(async () => {
      changeValue(textarea, 'Здравствуйте');
    });
    await act(async () => {
      view.container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(createChatConversation).toHaveBeenCalledWith(expect.objectContaining({
      customerName: 'Анна Иванова',
      customerContact: '+7 900',
      message: 'Здравствуйте',
    }));
    expect(window.localStorage.getItem('cozyhome:customer-chat:v1')).toContain('token-1');
    expect(view.container.textContent).toContain('Здравствуйте');
    view.unmount();
  });

  it('polls existing stored chat when opened', async () => {
    window.localStorage.setItem('cozyhome:customer-chat:v1', JSON.stringify({
      conversationId: 'chat-1',
      conversationToken: 'token-1',
    }));
    getChatMessages.mockResolvedValueOnce({
      conversationId: 'chat-1',
      status: 'OPEN',
      messages: [
        {
          id: 'message-manager',
          sender: 'MANAGER',
          senderLabel: 'Менеджер',
          body: 'Добрый день',
          createdAt: '2026-07-17T10:02:00Z',
        },
      ],
    });
    const view = renderWidget();

    await act(async () => {
      view.container.querySelector('button[aria-label="Открыть чат"]').click();
      await Promise.resolve();
    });

    expect(getChatMessages).toHaveBeenCalledWith('chat-1', 'token-1', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(view.container.textContent).toContain('Добрый день');
    view.unmount();
  });

  it('sends follow-up messages through existing conversation', async () => {
    window.localStorage.setItem('cozyhome:customer-chat:v1', JSON.stringify({
      conversationId: 'chat-1',
      conversationToken: 'token-1',
    }));
    const view = renderWidget();
    await act(async () => {
      view.container.querySelector('button[aria-label="Открыть чат"]').click();
    });
    await act(async () => {
      changeValue(view.container.querySelector('#customer-chat-message'), 'Еще вопрос');
    });
    await act(async () => {
      view.container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(sendChatMessage).toHaveBeenCalledWith('chat-1', 'token-1', 'Еще вопрос');
    expect(view.container.textContent).toContain('Еще вопрос');
    view.unmount();
  });

  it('starts a new conversation after the previous one is closed', async () => {
    window.localStorage.setItem('cozyhome:customer-chat:v1', JSON.stringify({
      conversationId: 'chat-closed',
      conversationToken: 'token-closed',
    }));
    getChatMessages.mockResolvedValueOnce({
      conversationId: 'chat-closed',
      status: 'CLOSED',
      messages: [
        {
          id: 'message-old',
          sender: 'CUSTOMER',
          senderLabel: 'Анна',
          body: 'Старый вопрос',
          createdAt: '2026-07-17T10:00:00Z',
        },
      ],
    });
    const view = renderWidget();

    await act(async () => {
      view.container.querySelector('button[aria-label="Открыть чат"]').click();
      await Promise.resolve();
    });

    const startButton = Array.from(view.container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Начать новый диалог');
    expect(startButton).toBeDefined();

    await act(async () => {
      startButton.click();
    });

    expect(window.localStorage.getItem('cozyhome:customer-chat:v1')).toBeNull();
    expect(view.container.textContent).not.toContain('Старый вопрос');
    expect(view.container.querySelector('input[placeholder="Ваше имя"]')).not.toBeNull();
    expect(view.container.querySelector('#customer-chat-message')).not.toBeNull();

    await act(async () => {
      changeValue(view.container.querySelector('#customer-chat-message'), 'Новый вопрос');
    });
    await act(async () => {
      view.container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(createChatConversation).toHaveBeenCalledWith(expect.objectContaining({ message: 'Новый вопрос' }));
    expect(sendChatMessage).not.toHaveBeenCalled();
    view.unmount();
  });
});
