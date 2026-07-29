import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  confirmMarketingSubscription,
  unsubscribeMarketingSubscription
} from '../api';
import Seo from '../components/Seo';
import { Button, Card } from '../components/ui';
import { METRIKA_GOALS, trackGoal } from '../utils/metrika';

const COPY = {
  confirm: {
    title: 'Подтверждение подписки',
    pending: 'Подтверждаем адрес…',
    CONFIRMED: 'Подписка подтверждена. Теперь письма будут приходить только на подтверждённый адрес.',
    EXPIRED: 'Ссылка истекла. Вернитесь на главную и запросите новое письмо.',
    INVALID: 'Ссылка недействительна или уже была заменена новой.'
  },
  unsubscribe: {
    title: 'Отказ от рассылки',
    pending: 'Отключаем рассылку…',
    UNSUBSCRIBED: 'Рассылка отключена. На этот адрес больше не будут приходить рекламные письма.',
    INVALID: 'Ссылка недействительна.'
  }
};

function SubscriptionActionPage({ mode }) {
  const copy = COPY[mode];
  const tokenRef = useRef('');
  const [status, setStatus] = useState('PENDING');
  const [isLoading, setIsLoading] = useState(true);

  const run = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) {
      setStatus('INVALID');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = mode === 'confirm'
        ? await confirmMarketingSubscription(token)
        : await unsubscribeMarketingSubscription(token);
      const nextStatus = response?.status || 'INVALID';
      setStatus(nextStatus);
      if (mode === 'confirm' && nextStatus === 'CONFIRMED') {
        trackGoal(METRIKA_GOALS.NEWSLETTER_CONFIRMED, { source: 'email_link' });
      }
    } catch (error) {
      setStatus('RETRY');
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    const url = new URL(window.location.href);
    tokenRef.current = url.searchParams.get('token') || '';
    url.searchParams.delete('token');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    run();
  }, [run]);

  const message = isLoading
    ? copy.pending
    : status === 'RETRY'
    ? 'Не удалось выполнить запрос. Проверьте соединение и повторите.'
    : copy[status] || copy.INVALID;

  return (
    <div className="page-section">
      <Seo
        title={copy.title}
        description={copy.title}
        canonicalPath={mode === 'confirm' ? '/subscribe/confirm' : '/subscribe/unsubscribe'}
        robots="noindex,nofollow"
      />
      <div className="page-shell">
        <Card padding="lg" className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Рассылка</p>
          <h1 className="mt-3 text-2xl font-semibold">{copy.title}</h1>
          <p className="mt-3 text-sm text-muted" aria-live="polite">{message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {status === 'RETRY' ? (
              <Button type="button" onClick={run} disabled={isLoading}>
                Повторить
              </Button>
            ) : null}
            <Button as={Link} to="/#newsletter" variant="secondary">
              На главную
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default SubscriptionActionPage;
