import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../ui';
import { createChatConversation, getChatMessages, sendChatMessage } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const STORAGE_KEY = 'cozyhome:customer-chat:v1';
const MAX_MESSAGE_LENGTH = 2000;
const POLL_INTERVAL_MS = 4000;

function ChatBubbleIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 6.5A6.5 6.5 0 0 1 11 3h2a6.5 6.5 0 0 1 3.9 11.7L12 20l-1-3H9a6.5 6.5 0 0 1-4.5-10.5z" />
      <path d="M8.5 10.5h7" />
      <path d="M8.5 13.5h4.5" />
    </svg>
  );
}

function CloseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

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

function CustomerChatWidget() {
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

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] right-4 z-[180] sm:right-6">
      {isOpen ? (
        <section
          className="mb-3 flex h-[min(78dvh,38rem)] w-[calc(100vw-2rem)] max-w-[24rem] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_24px_60px_rgba(43,39,34,0.22)] sm:w-[24rem]"
          aria-label="Чат с менеджером"
        >
          <header className="flex items-center justify-between gap-3 border-b border-ink/10 bg-[rgb(249,244,236)] px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-tight text-ink">Чат с менеджером</h2>
              <p className="text-xs text-muted">
                {status === 'CLOSED' ? 'Диалог закрыт' : 'Обычно отвечаем в ближайшее время'}
              </p>
            </div>
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              onClick={() => setIsOpen(false)}
              aria-label="Закрыть чат"
            >
              <CloseIcon />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[rgb(251,247,241)] px-4 py-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink/15 bg-white/80 px-4 py-5 text-sm text-muted">
                Напишите вопрос, и менеджер ответит здесь.
              </div>
            ) : (
              messages.map((message) => {
                const isCustomer = message.sender === 'CUSTOMER';
                return (
                  <article
                    key={message.id}
                    className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      isCustomer
                        ? 'ml-auto bg-primary text-white'
                        : 'mr-auto border border-ink/10 bg-white text-ink'
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

          <form onSubmit={handleSubmit} className="border-t border-ink/10 bg-white px-4 py-3">
            {status === 'CLOSED' && chatSession ? (
              <Button type="button" block onClick={handleStartNewConversation}>
                Начать новый диалог
              </Button>
            ) : (
              <>
                {!chatSession ? (
                  <div className="mb-3 grid gap-2">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Ваше имя"
                      className="control-inline min-h-[42px] rounded-xl border border-ink/10 px-3 text-sm"
                      maxLength={160}
                    />
                    <input
                      type="text"
                      value={customerContact}
                      onChange={(event) => setCustomerContact(event.target.value)}
                      placeholder="Телефон или email"
                      className="control-inline min-h-[42px] rounded-xl border border-ink/10 px-3 text-sm"
                      maxLength={240}
                    />
                  </div>
                ) : null}
                <label className="sr-only" htmlFor="customer-chat-message">
                  Сообщение
                </label>
                <textarea
                  id="customer-chat-message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Напишите сообщение"
                  maxLength={MAX_MESSAGE_LENGTH}
                  className="control-inline min-h-[76px] w-full resize-none rounded-xl border border-ink/10 px-3 py-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
                {error ? <p className="mt-2 text-xs font-semibold text-red-700">{error}</p> : null}
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
        className="ml-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-white shadow-[0_18px_38px_rgba(182,91,74,0.36)] transition hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/25"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isOpen ? 'Скрыть чат' : 'Открыть чат'}
        aria-expanded={isOpen}
      >
        <ChatBubbleIcon />
      </button>
    </div>
  );
}

export default CustomerChatWidget;
