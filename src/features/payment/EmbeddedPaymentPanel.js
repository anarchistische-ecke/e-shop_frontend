import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import NotificationBanner from '../../components/NotificationBanner';
import { Button, Card } from '../../components/ui';
import { createNotification } from '../../utils/notifications';
import { getCustomerSafeErrorMessage } from '../../utils/customerErrors';
import { loadPaymentWidgetScript } from './widget';

function createWidgetNotification(error, providerName) {
  const message = getCustomerSafeErrorMessage(error, {
    context: 'paymentWidget',
    fallbackMessage: 'Не удалось подготовить форму оплаты. Можно безопасно запросить её ещё раз.'
  });

  return createNotification({
    type: 'error',
    title: `Не удалось открыть форму ${providerName}`,
    message
  });
}

function EmbeddedPaymentPanel({
  paymentConfig,
  paymentSession,
  isStarting = false,
  onRequestNewSession,
  onRefreshStatus,
  onOpenOrder,
  className = ''
}) {
  const containerId = useId().replace(/[:]/g, '-');
  const widgetRef = useRef(null);
  const [renderNonce, setRenderNonce] = useState(0);
  const [widgetState, setWidgetState] = useState('idle');
  const [widgetError, setWidgetError] = useState(null);

  const providerName = paymentConfig?.providerName || 'платёжного партнёра';
  const canRenderWidget = Boolean(
    paymentSession?.confirmationToken &&
    paymentSession?.returnUrl
  );

  const secureNote = useMemo(
    () =>
      providerName === 'Онлайн-оплата'
        ? 'Номер карты, срок действия и CVC обрабатываются платёжным провайдером в отдельной защищённой форме.'
        : `Номер карты, срок действия и CVC обрабатываются ${providerName} в отдельной защищённой форме.`,
    [providerName]
  );

  useEffect(() => {
    if (!canRenderWidget) {
      setWidgetState('error');
      setWidgetError(
        createNotification({
          type: 'warning',
          title: 'Платёжная сессия ещё не готова',
          message: 'Заказ уже создан. Запросите форму оплаты ещё раз или откройте страницу заказа.'
        })
      );
      return undefined;
    }

    let active = true;
    let mountedWidget = null;
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }

    setWidgetState('loading');
    setWidgetError(null);

    loadPaymentWidgetScript(paymentConfig?.widgetScriptUrl)
      .then((WidgetConstructor) => {
        if (!active) {
          return;
        }
        setWidgetState('rendering');
        mountedWidget = new WidgetConstructor({
          confirmation_token: paymentSession.confirmationToken,
          return_url: paymentSession.returnUrl,
          error_callback: (error) => {
            if (!active) {
              return;
            }
            setWidgetState('error');
            setWidgetError(createWidgetNotification(error, providerName));
          }
        });
        widgetRef.current = mountedWidget;
        mountedWidget.render(containerId);
        if (!active) {
          return;
        }
        setWidgetState('ready');
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setWidgetState('error');
        setWidgetError(createWidgetNotification(error, providerName));
      });

    return () => {
      active = false;
      const currentWidget = mountedWidget || widgetRef.current;
      widgetRef.current = null;
      if (currentWidget && typeof currentWidget.destroy === 'function') {
        currentWidget.destroy();
      } else if (currentWidget && typeof currentWidget.unmount === 'function') {
        currentWidget.unmount();
      }
      const cleanupContainer = document.getElementById(containerId);
      if (cleanupContainer) {
        cleanupContainer.innerHTML = '';
      }
    };
  }, [
    canRenderWidget,
    containerId,
    paymentConfig?.widgetScriptUrl,
    paymentSession?.confirmationToken,
    paymentSession?.returnUrl,
    providerName,
    renderNonce
  ]);

  return (
    <Card
      id="embedded-payment-panel"
      variant="soft"
      padding="md"
      className={`border-primary/20 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Защищённая форма оплаты</p>
          <h3 className="mt-1 text-xl font-semibold">{providerName}</h3>
          <p className="mt-1 text-sm text-muted">
            Оплата проходит внутри приложения, но чувствительные данные обрабатывает платёжный провайдер.
          </p>
        </div>
        {paymentSession?.paymentId ? (
          <span className="rounded-full border border-ink/10 bg-white/85 px-3 py-1 text-xs text-muted">
            Платёж #{String(paymentSession.paymentId).slice(0, 8)}
          </span>
        ) : null}
      </div>

      {widgetError ? (
        <NotificationBanner notification={widgetError} className="mt-4" />
      ) : null}

      <div className="mt-4 rounded-[1.5rem] border border-ink/10 bg-white/95 p-4 shadow-[0_18px_40px_rgba(43,39,34,0.08)]">
        {(widgetState === 'loading' || widgetState === 'rendering' || isStarting) ? (
          <div className="mb-4 rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-sm text-ink/80">
            {isStarting
              ? 'Готовим платёжную сессию…'
              : 'Загружаем защищённую форму оплаты…'}
          </div>
        ) : null}

        <div
          id={containerId}
          aria-live="polite"
          aria-busy={widgetState === 'loading' || widgetState === 'rendering'}
          className="min-h-[320px]"
        />

        <div className="mt-4 space-y-2 text-xs text-muted">
          <p>{secureNote}</p>
          <p>После подтверждения банк или 3-D Secure при необходимости вернут вас на страницу заказа.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setWidgetError(null);
            setRenderNonce((value) => value + 1);
          }}
          disabled={isStarting}
        >
          Попробовать форму ещё раз
        </Button>
        {typeof onRequestNewSession === 'function' ? (
          <Button variant="ghost" onClick={onRequestNewSession} disabled={isStarting}>
            Запросить новую форму
          </Button>
        ) : null}
        {typeof onRefreshStatus === 'function' ? (
          <Button variant="ghost" onClick={onRefreshStatus} disabled={isStarting}>
            Проверить статус оплаты
          </Button>
        ) : null}
        {typeof onOpenOrder === 'function' ? (
          <Button variant="ghost" onClick={onOpenOrder} disabled={isStarting}>
            Открыть страницу заказа
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export default EmbeddedPaymentPanel;
