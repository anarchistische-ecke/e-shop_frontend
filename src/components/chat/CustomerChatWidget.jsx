import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Textarea } from '../ui';
import { ChatIcon, CloseIcon } from '../header/icons';
import { createChatConversation, getChatMessages, sendChatMessage } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const STORAGE_KEY = 'cozyhome:customer-chat:v1';
const MAX_MESSAGE_LENGTH = 2000;
const POLL_INTERVAL_MS = 4000;

function readStoredChat() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

function writeStoredChat(value) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function clearStoredChat() {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

function mergeMessages(current, incoming) {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return current;
  }
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => {
    if (message?.id) {
      byId.set(message.id, message);
    }
  });
  return Array.from(byId.values()).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

function latestMessageTimestamp(messages) {
  return messages.length > 0 ? messages[messages.length - 1].createdAt : undefined;
}

function CustomerChatWidget({ elevatedForMobileAction = false, hasMobileNavigation = false }) {
  const auth = useAuth();
  const initialStoredChat = useMemo(readStoredChat, []);
  const [isOpen, setIsOpen] = useState(false);
  const [chatSession, setChatSession] = useState(initialStoredChat);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('OPEN');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const latestMessageAtRef = useRef();

  useEffect(() => {
    const profile = auth?.profile || auth?.tokenParsed || {};
    if (!customerName) {
      const name = [profile.firstName || profile.given_name, profile.lastName || profile.family_name]
        .filter(Boolean)
        .join(' ')
        .trim() || profile.name || '';
      setCustomerName(name);
    }
    if (!customerContact) {
      setCustomerContact(profile.phone || profile.email || '');
    }
  }, [auth?.profile, auth?.tokenParsed, customerContact, customerName]);

  useEffect(() => {
    if (!chatSession) {
      return;
    }
    writeStoredChat(chatSession);
  }, [chatSession]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    latestMessageAtRef.current = latestMessageTimestamp(messages);
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen || !chatSession?.conversationId || !chatSession?.conversationToken) {
      return undefined;
    }

    let stopped = false;
    let timeoutId;
    let activeController;
    const poll = async () => {
      const controller = new AbortController();
      activeController = controller;
      try {
        const response = await getChatMessages(chatSession.conversationId, chatSession.conversationToken, {
          after: latestMessageAtRef.current,
          signal: controller.signal
        });
        if (!stopped && response) {
          setStatus(response.status || 'OPEN');
          setMessages((current) => mergeMessages(current, response.messages || []));
          setError('');
        }
      } catch (err) {
        if (!stopped && err.name !== 'AbortError') {
          setError('Не удалось обновить чат. Попробуем еще раз.');
        }
      } finally {
        if (!stopped) {
          timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    poll();
    return () => {
      stopped = true;
      activeController?.abort();
      window.clearTimeout(timeoutId);
    };
  }, [chatSession, isOpen]);

  const canSend = draft.trim().length > 0 && draft.trim().length <= MAX_MESSAGE_LENGTH && !isSending && status !== 'CLOSED';

  const handleStartNewConversation = () => {
    clearStoredChat();
    latestMessageAtRef.current = undefined;
    setChatSession(null);
    setMessages([]);
    setStatus('OPEN');
    setDraft('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) {
      setError('Напишите сообщение.');
      return;
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(`Сообщение должно быть короче ${MAX_MESSAGE_LENGTH} символов.`);
      return;
    }

    setIsSending(true);
    setError('');
    try {
      if (!chatSession?.conversationId || !chatSession?.conversationToken) {
        const response = await createChatConversation({
          customerName,
          customerContact,
          message,
          pageUrl: typeof window !== 'undefined' ? window.location.href : ''
        });
        const nextSession = {
          conversationId: response.conversationId,
          conversationToken: response.conversationToken
        };
        setChatSession(nextSession);
        setStatus(response.status || 'OPEN');
        setMessages(response.messages || []);
      } else {
        const response = await sendChatMessage(chatSession.conversationId, chatSession.conversationToken, message);
        setStatus(response.status || status);
        setMessages((current) => mergeMessages(current, response.messages || []));
      }
      setDraft('');
    } catch (err) {
      setError(err.message || 'Не удалось отправить сообщение.');
    } finally {
      setIsSending(false);
    }
  };

  const mobileBottom = hasMobileNavigation
    ? '[--chat-bottom:calc(var(--site-header-height)+1rem)]'
    : elevatedForMobileAction
      ? '[--chat-bottom:calc(env(safe-area-inset-bottom,0px)+7rem)]'
      : '[--chat-bottom:calc(env(safe-area-inset-bottom,0px)+1rem)]';
  const inlineLauncher = elevatedForMobileAction && !isOpen;

  return (
    <div
      data-testid="customer-chat-widget"
      className={`bottom-[var(--chat-bottom)] right-4 z-40 transition-[bottom] sm:right-6 lg:z-[180] lg:[--chat-bottom:calc(env(safe-area-inset-bottom,0px)+1rem)] ${mobileBottom} ${inlineLauncher ? 'px-4 pb-5 lg:fixed lg:p-0' : 'fixed'}`}
    >
      {isOpen ? (
        <section
          id="customer-chat-panel"
          className="mb-3 flex h-[min(78dvh,38rem)] max-h-[calc(var(--viewport-block)-var(--chat-bottom)-4.5rem-env(safe-area-inset-top,0px))] w-[calc(100vw-2rem)] max-w-[24rem] flex-col overflow-y-auto overscroll-y-contain scroll-pt-20 rounded-xl border border-line bg-white shadow-[0_12px_32px_rgba(38,43,37,0.16)] sm:w-[24rem]"
          aria-label="Чат с менеджером"
        >
          <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
            <div className="min-w-0">
              <h2 className="font-sans text-base font-bold leading-tight text-ink">Чат с менеджером</h2>
              <p className="text-xs text-muted">
                {status === 'CLOSED' ? 'Диалог закрыт' : 'Обычно отвечаем в ближайшее время'}
              </p>
            </div>
            <button
              type="button"
              className="focus-ring-soft grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-secondary"
              onClick={() => setIsOpen(false)}
              aria-label="Закрыть чат"
            >
              <CloseIcon />
            </button>
          </header>

          <div ref={scrollRef} className="min-h-24 flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4">
            {messages.length === 0 ? (
              <div className="text-sm text-muted">
                Напишите вопрос, и менеджер ответит здесь.
              </div>
            ) : (
              messages.map((message) => {
                const isCustomer = message.sender === 'CUSTOMER';
                return (
                  <article
                    key={message.id}
                    className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
                      isCustomer
                        ? 'ml-auto bg-primary text-white'
                        : 'mr-auto border border-line bg-white text-ink'
                    }`}
                  >
                    <p className={isCustomer ? 'text-white' : 'text-ink'}>{message.body}</p>
                    <p className={`mt-1 text-[11px] ${isCustomer ? 'text-white/75' : 'text-muted'}`}>
                      {isCustomer ? 'Вы' : message.senderLabel || 'Менеджер'}
                    </p>
                  </article>
                );
              })
            )}
          </div>

          <form onSubmit={handleSubmit} className="shrink-0 border-t border-line bg-white px-4 py-3">
            {status === 'CLOSED' && chatSession ? (
              <Button type="button" block onClick={handleStartNewConversation}>
                Начать новый диалог
              </Button>
            ) : (
              <>
                {!chatSession ? (
                  <div className="mb-3 grid gap-2">
                    <Input
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Ваше имя"
                      aria-label="Ваше имя"
                      autoComplete="name"
                      maxLength={160}
                    />
                    <Input
                      type="text"
                      value={customerContact}
                      onChange={(event) => setCustomerContact(event.target.value)}
                      placeholder="Телефон или email"
                      aria-label="Телефон или email"
                      maxLength={240}
                    />
                  </div>
                ) : null}
                <label className="sr-only" htmlFor="customer-chat-message">
                  Сообщение
                </label>
                <Textarea
                  id="customer-chat-message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Напишите сообщение"
                  maxLength={MAX_MESSAGE_LENGTH}
                  className="min-h-[76px] resize-none"
                />
                {error ? <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p> : null}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">{draft.length}/{MAX_MESSAGE_LENGTH}</span>
                  <Button type="submit" size="sm" disabled={!canSend}>
                    {isSending ? 'Отправляем…' : 'Отправить'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </section>
      ) : null}

      <button
        type="button"
        data-testid="customer-chat-launcher"
        className={`focus-ring-soft ml-auto flex min-h-[44px] items-center justify-center gap-2 border border-primary font-bold transition-colors ${inlineLauncher ? 'rounded-lg bg-white px-3 text-sm text-primary hover:bg-sky lg:h-11 lg:w-11 lg:rounded-full lg:bg-primary lg:p-0 lg:text-white' : 'h-11 w-11 rounded-full bg-primary text-white hover:bg-accent'}`}
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isOpen ? 'Скрыть чат' : 'Открыть чат'}
        aria-expanded={isOpen}
        aria-controls={isOpen ? 'customer-chat-panel' : undefined}
      >
        <ChatIcon />
        {inlineLauncher ? <span className="lg:sr-only">Чат с менеджером</span> : null}
      </button>
    </div>
  );
}

export default CustomerChatWidget;
